# pm-internal

**Saya Akan Monitor** adalah aplikasi internal Jasa Marga untuk memonitor proyek dan mengelola pekerjaan departemen. Aplikasi ini menggunakan modern monolith: Laravel menangani routing, autentikasi, otorisasi, validasi, transaksi, query, notifikasi, dan penyimpanan; React melalui Inertia menangani pengalaman kerja interaktif tanpa API SPA terpisah.

Antarmuka desktop berorientasi produktivitas, dengan pola navigasi, List, Board, Views Bar, serta detail task yang terinspirasi ClickUp. Bingkai aplikasi, sidebar, dan halaman autentikasi memakai biru tua Jasa Marga, dipadukan dengan area kerja terang dan aksen kuning. Kartu, panel, tombol, dan dialog memakai sudut membulat; List tetap ringkas untuk membaca banyak tugas. Mode gelap dan navigasi mobile tetap tersedia.

## Fitur V1

- Autentikasi sesi, reset password, profil, perubahan password, 2FA/passkey opsional, dan rate limiting login.
- Registrasi publik dinonaktifkan; akun hanya dibuat administrator.
- Peran global `ADMIN` dan `MEMBER`, serta peran proyek `OWNER`, `MANAGER`, `MEMBER`, dan `VIEWER`.
- Direktori proyek, overview monitoring, status, health, progres berbasis kategori workflow, anggota, workflow, label, dan arsip.
- Task ID per proyek seperti `IRP-42`, multi-assignee, prioritas, label, tanggal, deskripsi, komentar, attachment privat, dan activity log.
- List view dengan grouping status, pencarian, filter URL, sorting server-side, pagination, quick add, dan pengubahan properti inline.
- Board Kanban dengan drag-and-drop, perpindahan antar-status, reorder, optimistic update, dan persistensi posisi.
- Home/My Work, My Tasks, Inbox notifikasi database, global search, dan administrasi pengguna.
- Halaman error Inertia untuk 403, 404, 419, 422, 500, dan 503 pada produksi.

## Teknologi

- PHP 8.4 pada image pengembangan
- Laravel 13 dan Laravel Fortify
- React 19, TypeScript, Inertia.js 3
- Tailwind CSS 4, Radix/shadcn primitives, Lucide React
- dnd-kit untuk Board
- PostgreSQL 17 pada Docker Compose
- PHPUnit 12, Laravel Pint, Larastan/PHPStan level 7
- Vite 8 melalui Vite Plus

## Arsitektur dan data

Laravel dan React berada dalam satu deployment serta menggunakan session cookie dan CSRF standar Laravel. Semua mutasi domain melewati Form Request, Policy/Gate, dan route model binding yang di-scope ke proyek. Query layar utama menggunakan eager loading, pagination, dan payload presenter khusus agar model Eloquent tidak dikirim mentah ke browser.

Data utama tetap relasional: `users`, `projects`, `project_user`, `project_statuses`, `tasks`, `task_user`, `labels`, `label_task`, `comments`, `attachments`, `activity_logs`, `notifications`, `sessions`, dan `password_reset_tokens`. Metadata activity memakai JSONB. Foreign key, unique constraint, dan indeks mengikuti pola query utama.

Nomor task disimpan per proyek melalui `projects.next_task_number`. Pembuatan task mengunci row proyek dengan `SELECT ... FOR UPDATE` di dalam transaksi, kemudian constraint unik `(project_id, task_number)` menjadi pertahanan kedua terhadap duplikasi.

## Logo dan branding

Logo bersumber dari `public/brand/jasamarga-logo.png` dan simbol tanpa tulisan yang disediakan pengguna di `public/brand/logo1.png`. Sesuai arahan desain, versi putih ditampilkan melalui CSS mask di atas latar biru tanpa kotak pembungkus. Halaman login memakai komposisi form di kiri, judul dua baris “Saya Akan / Lawan!”, serta simbol besar dengan efek cahaya di kanan. File sumber tetap tersimpan tanpa perubahan.

## Alur pekerjaan

- Admin dapat membuka **Buat proyek** dari beranda, menu **Buat**, atau ikon tambah di sidebar Proyek Tim. Anggota biasa tetap mengikuti hak akses yang ditetapkan.
- Proyek baru menampilkan petunjuk menambah anggota, membuat tugas, dan memilih penanggung jawab.
- Beranda menampilkan tugas yang ditugaskan kepada pengguna, termasuk tanpa tenggat dan tenggat lebih dari tujuh hari. Tugas proyek yang diarsipkan atau tidak lagi dapat diakses tidak muncul dalam pekerjaan pribadi.
- **Tugas Saya** membuka pekerjaan yang belum selesai secara default, dengan tab Selesai dan Semua. Checkbox menyelesaikan atau membuka kembali tugas sesuai workflow dan izin proyek.
- Daftar proyek menampilkan status, penanggung jawab, tenggat, prioritas, dan komentar dalam kolom. Tombol komentar membuka detail langsung ke kolom penulisan komentar.

## Kebutuhan development

- Git.
- Docker Engine + plugin Docker Compose v2 (Linux), atau Docker Desktop dengan Linux containers (Windows/macOS).
- Internet untuk download image dan dependency saat setup pertama. Sediakan sekitar 4 GB RAM dan beberapa GB ruang kosong untuk Docker.
- Port kosong: `8000` (aplikasi), `5173` (Vite), `5432` (PostgreSQL).

PHP 8.4, Composer 2, Node.js 22, dan npm tersedia **di dalam image Docker**. Tidak perlu memasangnya di komputer host. Windows: gunakan terminal WSL2 dan clone di filesystem Linux, misalnya `~/projects/pm-internal`. macOS/Linux: gunakan terminal biasa. Command di bawah memakai sintaks shell Bash.

Docker ini untuk **development lokal**, bukan deployment produksi. Source di-bind mount, database berada dalam named volume terpisah per project Compose, dan port hanya dibuka pada localhost. Tidak ada path absolut komputer pengembang atau nama container tetap.

## Setup pertama untuk Adit / clone baru

Ganti `USERNAME_GITHUB` dengan pemilik repository:

```bash
git clone https://github.com/USERNAME_GITHUB/pm-internal.git
cd pm-internal
cp .env.example .env
```

Linux/WSL: cek `id -u` dan `id -g`, lalu isi `LOCAL_UID` / `LOCAL_GID` di `.env` dengan hasilnya sebelum build (default `1000`). Ini menghindari file hasil container dimiliki root. macOS dapat memakai default.

```bash
docker compose build app
docker compose up -d postgres
docker compose run --rm --no-deps app composer install
docker compose run --rm --no-deps app npm ci
docker compose run --rm --no-deps app php artisan key:generate
docker compose run --rm app php artisan migrate --seed
docker compose run --rm --no-deps app php artisan storage:link
docker compose up -d app frontend
```

Buka **http://localhost:8000**. Jangan membuka port Vite sebagai halaman aplikasi. Wayfinder menghasilkan file route TypeScript saat Vite mulai; jangan jalankan typecheck sebelum Vite/build/generate pertama selesai.

### Akses akun

Akun tim menggunakan identitas `nama@planning`. Hubungi Vendra untuk mendapatkan akun dan password awal; kredensial dibagikan secara langsung, bukan melalui README. Nama profil dan password dapat diubah melalui menu Pengaturan setelah login.

**GitHub menyimpan source, bukan database.** Akun tim yang sudah dibuat tidak otomatis tersedia pada database hasil clone baru. Untuk development dengan database sendiri, koordinasikan penyiapan akun lokal dengan Vendra terlebih dahulu.

Seeder menambahkan data contoh untuk development, bukan akun tim yang sudah disepakati. Jalankan seed hanya saat setup database contoh baru; jangan mengulangnya pada database berisi pekerjaan tim. Jangan memasukkan dump database atau password tim ke repository.

## Menjalankan dan menghentikan sehari-hari

```bash
docker compose up -d postgres app frontend
docker compose logs -f app frontend
```

`Ctrl+C` hanya keluar dari log. Untuk menghentikan:

```bash
docker compose stop
```

`docker compose down` menghapus container/network tetapi mempertahankan database. **Jangan tambahkan `-v` kecuali sengaja ingin menghapus database lokal.** Nama folder memengaruhi nama project/volume Compose; jangan mengganti nama project pada instalasi yang sudah dipakai tanpa rencana pemindahan datanya.

Untuk memakai asset build tanpa Vite:

```bash
docker compose stop frontend
docker compose run --rm --no-deps app php -r "@unlink('public/hot');"
docker compose run --rm --no-deps app npm run build
docker compose up -d app postgres
```

## Setelah menarik perubahan dari GitHub

Simpan pekerjaan di branch sendiri terlebih dahulu. Setelah `git pull`:

```bash
docker compose run --rm --no-deps app composer install
docker compose stop frontend
docker compose run --rm --no-deps app npm ci
docker compose run --rm app php artisan migrate
docker compose restart app
docker compose up -d frontend
```

Jika Dockerfile berubah, jalankan `docker compose build app` lalu `docker compose up -d --force-recreate app frontend`. Gunakan `composer install` / `npm ci` supaya versi mengikuti lockfile; jangan rutin menjalankan update dependency.

## Verifikasi dan pengujian

Database test `saya_akan_monitor_test` dibuat otomatis saat volume PostgreSQL pertama kali diinisialisasi. Semua tes dijalankan pada database ini, terpisah dari data kerja. Pada volume lama yang belum memilikinya:

```bash
docker compose exec postgres psql -U saya_monitor -d postgres -c 'CREATE DATABASE saya_akan_monitor_test OWNER saya_monitor;'
```

```bash
docker compose run --rm -e DB_DATABASE=saya_akan_monitor_test app composer test
docker compose run --rm --no-deps app php artisan wayfinder:generate --with-form
docker compose run --rm --no-deps app npm run check
docker compose run --rm --no-deps app npm run types:check
docker compose run --rm --no-deps app npm run build
```

`composer test` mencakup Pint, PHPStan, dan PHPUnit. Test dapat mereset tabel: selalu gunakan database test, bukan database kerja. Default credential PostgreSQL pada Compose dan PHPUnit sengaja sama untuk development; jika mengubahnya, sesuaikan keduanya.

## Troubleshooting

- **Port sudah dipakai:** ubah `APP_PORT`, `FORWARD_DB_PORT`, atau `VITE_PORT` di `.env`. Sesuaikan `APP_URL` bila mengganti port aplikasi. `DB_PORT` tetap `5432` untuk koneksi antar-container. Jalankan ulang `docker compose up -d`.
- **Halaman kosong / asset gagal dimuat:** cek `docker compose logs frontend`. Untuk mode build, hentikan Vite dan hapus `public/hot` dengan command di atas.
- **Permission denied di Linux:** samakan `LOCAL_UID`/`LOCAL_GID` dengan `id -u`/`id -g`, lalu build ulang. Pada Fedora/SELinux enforcing, bind mount project yang dibagi app/frontend dapat memerlukan akhiran `:z` (`.:/var/www/html:z`); jangan relabel folder home secara keseluruhan.
- **Perubahan file tidak muncul di Windows:** simpan clone di filesystem WSL2, bukan `/mnt/c`, lalu jalankan Compose dari WSL.
- **Vendor atau node_modules bermasalah:** install ulang dari container menggunakan `composer install` dan `npm ci`. Jangan berbagi folder dependency hasil instalasi antar-OS.
- **Login dengan `nama@planning`:** akun hanya tersedia pada database tempat akun dibuat. Jika memakai database lokal baru, hubungi Vendra untuk penyiapan akun.
- **Lupa password:** development memakai mail driver `log`; email reset masuk `storage/logs/laravel.log`, tidak dikirim ke internet.

## Kolaborasi GitHub

Panduan membuat repository **pm-internal**, push pertama, mengundang Adit, dan alur branch/PR ada di [docs/github.md](docs/github.md). Workflow GitHub Actions menjalankan pemeriksaan frontend/backend melalui image Docker yang sama pada pull request dan push ke `main`.

## Konfigurasi environment

Nilai penting tersedia di `.env.example`:

- `APP_*`: nama, environment, URL, timezone, debug, dan key aplikasi.
- `DB_*`: koneksi PostgreSQL.
- `SESSION_*`: database session dan keamanan cookie.
- `MAIL_*`: reset password; driver `log` aman untuk development.
- `FILESYSTEM_DISK`: `local` untuk development.
- `AWS_*`: endpoint S3/MinIO untuk produksi bila adapter dipasang.

Jangan commit `.env`, credential database produksi, `APP_KEY`, credential SMTP, atau credential object storage.

## Attachment dan object storage

Attachment development disimpan privat di `storage/app/private`; download selalu melalui controller terotorisasi dan tidak mengekspos path filesystem. Batas default 10 MB dan tipe file dibatasi di server.

Untuk S3/MinIO, pasang adapter yang kompatibel lalu set `FILESYSTEM_DISK=s3` dan variabel `AWS_*`:

```bash
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

Lakukan migrasi object yang sudah ada sebelum mengganti disk pada instalasi yang telah berisi attachment.

## Persiapan produksi

Gunakan PHP-FPM + Nginx/Apache dengan document root menuju `public/`, PostgreSQL terkelola, HTTPS wajib, dan proses deployment yang atomik. Konfigurasi minimum:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://monitor.internal.example
APP_TIMEZONE=Asia/Jakarta
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
LOG_LEVEL=warning
```

Perintah release:

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

Pastikan user proses web dapat menulis ke `storage/` dan `bootstrap/cache/`, tetapi tidak ke source code. Atur rotasi log, backup PostgreSQL dan attachment, monitoring `/up`, mail production, serta kebijakan retensi.

Jika aplikasi berada di belakang reverse proxy/load balancer, konfigurasikan `trustProxies` di `bootstrap/app.php` hanya untuk alamat proxy internal yang diketahui agar scheme HTTPS dan IP klien tidak dapat dipalsukan. Jangan memakai wildcard proxy pada jaringan yang tidak sepenuhnya dipercaya.

Notifikasi V1 menggunakan database dan operasi sinkron. `QUEUE_CONNECTION=database` telah siap untuk pekerjaan asynchronous mendatang; jika job queued mulai digunakan, jalankan worker di bawah systemd/Supervisor dan gunakan `php artisan queue:restart` saat release.

## Catatan autentikasi masa depan

Domain aplikasi hanya bergantung pada model user dan policy, bukan pada cara credential lokal diperoleh. Integrasi Microsoft Entra ID/Azure AD, LDAP, atau SSO perusahaan dapat ditambahkan melalui guard/provider tanpa merombak model proyek dan task. Tetap lakukan pemetaan identitas, status akun, dan role global di sisi server.
