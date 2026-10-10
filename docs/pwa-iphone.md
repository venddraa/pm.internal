# Akses dari Home Screen iPhone

Aplikasi ini dapat dibuka sebagai web app layar penuh dari Home Screen iPhone. Konfigurasi PWA sudah mencakup web app manifest, ikon Jasa Marga, nama singkat ITPG, dan warna tema. Aplikasi **tetap membutuhkan koneksi internet**: data pekerjaan, login, dan lampiran berasal dari server. Tidak ada cache offline untuk halaman atau dokumen internal.

## Syarat sebelum dicoba oleh tim

- Deploy **seluruh aplikasi Laravel + React/Inertia** di domain HTTPS yang dapat diakses iPhone, bukan hanya folder `public/build`.
- Sediakan PostgreSQL persisten, worker untuk antrean email, dan storage persisten/objek untuk lampiran privat. Konfigurasi produksi umum ada di [README](../README.md#persiapan-produksi).
- Set `APP_URL` ke domain final dan `SESSION_SECURE_COOKIE=true`. Uji login, buka Agenda Tim, simpan catatan status, unggah/unduh lampiran, lalu uji notifikasi sebelum mengundang anggota lain.
- Bila data lokal hendak dibawa ke produksi, migrasikan database dan lampiran dengan sengaja. Deployment baru tidak otomatis menyalin volume Docker lokal.

## Memasang di iPhone

1. Buka alamat HTTPS aplikasi di Safari, lalu login.
2. Tekan **Bagikan** → **Tambahkan ke Layar Utama**.
3. Pastikan nama **ITPG**, lalu tekan **Tambah**.
4. Buka ikon ITPG dari Home Screen. Jika diminta login lagi, lakukan sekali dari jendela aplikasi tersebut; penyimpanan/cookie web app bisa terpisah dari Safari.

Untuk menguji perubahan ikon atau manifest setelah pernah memasang aplikasi, hapus ikon lama dari Home Screen lalu tambahkan ulang.

## Pilihan hosting

Repo ini adalah satu aplikasi Laravel dengan React/Inertia, PostgreSQL, session database, queue worker email, dan file privat. Vercel tidak menyediakan runtime PHP resmi; PHP di Vercel memakai runtime komunitas dan function memiliki filesystem sementara. Jadi mengunggah repo ini langsung sebagai proyek Vercel tidak cukup untuk menjalankan seluruh aplikasi. Jika nanti Vercel tetap diinginkan, perlu rancangan serverless khusus beserta database eksternal, object storage, dan pengganti worker.

Untuk pilot tujuh orang, deploy Laravel utuh ke host yang mendukung proses web dan worker, misalnya Railway atau server/VPS perusahaan, dengan PostgreSQL dan storage persisten. Alamat HTTPS dari host itu tetap bisa dipasang ke Home Screen iPhone. Pilihan host dan izin menyimpan data kerja di luar lingkungan perusahaan sebaiknya diputuskan sebelum mengisi data pekerjaan nyata.
