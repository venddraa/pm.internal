# Notifikasi email: implementasi dan aktivasi Gmail

## Status dan cakupan

Tahap pertama sudah diimplementasikan:

- Inbox aplikasi tetap langsung menerima pemberitahuan tugas baru dan penambahan anggota proyek.
- Email untuk kedua kejadian tersebut masuk antrean `emails`, setelah transaksi database commit.
- Worker memeriksa lagi status akun, preferensi penerima, allowlist pilot, akses proyek, dan penugasan sebelum mengirim.
- Email notifikasi terpisah dari ID login. Pengguna mengisinya di **Pengaturan → Profil → Email notifikasi**, atau mengosongkannya untuk berhenti menerima email.
- Pengiriman default **nonaktif**; hanya alamat dalam allowlist yang dapat menerima. Allowlist kosong berarti tidak ada penerima.
- Perintah tes default hanya preview. Pengiriman sungguhan membutuhkan `--send` dan konfigurasi SMTP yang lengkap.

Belum aktif sampai akun Gmail pengirim dikonfigurasi. Tidak ada password Gmail atau alamat pribadi penerima yang ditanamkan dalam source/seed. Konfigurasi pilot ada di `.env` lokal dan kolom profil database; keduanya tidak ikut clone GitHub.

## 1. Persiapkan aplikasi dan penerima

```bash
docker compose exec app php artisan migrate
```

Isi email penerima pada profil akun yang relevan. Gunakan alamat email sungguhan; `nama@planning` adalah ID login internal. Untuk database clone baru, akun dan alamat penerima perlu disiapkan kembali.

## 2. Siapkan pengirim Gmail

Gunakan akun pengirim yang dikelola tim. Aktifkan verifikasi dua langkah lalu buat **App Password**, jika opsi itu tersedia pada akun tersebut. Akun organisasi dapat membatasi fitur ini; jika tidak tersedia, gunakan integrasi OAuth atau SMTP relay yang disetujui admin Google Workspace.

Simpan App Password langsung di `.env` lokal/server. Jangan kirim lewat chat, menulisnya di README, atau commit ke Git. Password login aplikasi tidak sama dengan App Password Google.

Contoh berikut menggunakan placeholder; ganti alamat dan rahasianya sendiri:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=sender@gmail.com
MAIL_PASSWORD="APP_PASSWORD_GOOGLE"
MAIL_FROM_ADDRESS=sender@gmail.com
MAIL_FROM_NAME="IT Planning & Governance Department"

WORK_EMAIL_ENABLED=true
WORK_EMAIL_ALLOWED_RECIPIENTS=recipient-one@gmail.com,recipient-two@gmail.com
QUEUE_CONNECTION=database
```

Port 587 menggunakan STARTTLS. `MAIL_FROM_ADDRESS` sebaiknya sama dengan akun pengirim. Biarkan `MAIL_URL` tidak terisi agar tidak menimpa konfigurasi ini.

Untuk tautan email yang dapat dibuka anggota tim, `APP_URL` harus berupa URL aplikasi yang memang bisa mereka akses. `http://localhost:8000` hanya membuka komputer penerima sendiri; kirim uji konten lokal boleh, tetapi penggunaan tim memerlukan deployment/URL internal yang dapat dijangkau.

## 3. Preview, uji kirim, lalu worker

```bash
docker compose exec app php artisan config:clear
docker compose exec app php artisan notifications:test-email vendra@planning
```

Command di atas menampilkan penerima dan subjek tanpa mengirim. Setelah alamat/config benar, jalankan satu per satu dan cek inbox/spam:

```bash
docker compose exec app php artisan notifications:test-email vendra@planning --send
docker compose exec app php artisan notifications:test-email asti@planning --send
```

Pesan sukses berarti SMTP menerima email, bukan bukti email sudah masuk inbox. Tes ini tidak membuat tugas/proyek atau notifikasi palsu pada inbox aplikasi.

Aktifkan worker setelah uji kirim berhasil:

```bash
docker compose --profile notifications up -d worker
docker compose logs -f worker
```

Jika source atau `.env` berubah, restart worker agar konfigurasi terbaru dipakai:

```bash
docker compose exec app php artisan config:clear
docker compose restart worker
```

Uji alur nyata dengan menugaskan pekerjaan kepada akun pilot dari akun lain. Tugas yang diberikan kepada diri sendiri mengikuti perilaku existing: tidak membuat notifikasi penugasan. Email hanya dikirim untuk kejadian baru setelah fitur diaktifkan, bukan seluruh histori inbox.

## 4. Kegagalan dan penghentian pilot

Pengiriman dicoba maksimal 3 kali, dengan jeda retry. SMTP timeout 30 detik, timeout job 60 detik, dan retry-after database 90 detik.

```bash
docker compose exec app php artisan queue:failed
```

Perbaiki penyebab (kredensial, batas pengiriman, atau koneksi), lalu retry ID job yang relevan:

```bash
docker compose exec app php artisan queue:retry ID_JOB
```

SMTP tidak menjamin exactly-once: bila koneksi putus setelah server menerima pesan, retry dapat menyebabkan duplikasi. Jangan mengulang retry tanpa memeriksa keadaan pengiriman.

Untuk berhenti, set `WORK_EMAIL_ENABLED=false`, jalankan `config:clear`, lalu restart atau stop worker. Inbox aplikasi tetap berfungsi. `MAIL_MAILER=log` hanya merekam pesan lokal, bukan mengirim ke Gmail.

## Tahap pengembangan berikutnya

1. **Komentar:** kirim kepada assignee yang masih memiliki akses, kecuali penulis komentar; gabungkan aktivitas berdekatan agar tidak membanjiri inbox.
2. **Deadline:** pengingat H-1 dan ringkasan tugas terlambat; scheduler harian mengikuti timezone aplikasi. Simpan kunci unik per tugas/penerima/tanggal/jenis agar scheduler berulang tidak menggandakan email. Lewati tugas selesai, diarsipkan, atau penerima yang aksesnya dicabut.
3. **Preferensi:** pilihan per jenis notifikasi dan verifikasi email tujuan sebelum membuka rollout untuk semua pengguna.
4. **WhatsApp:** gunakan kanal resmi WhatsApp Business Platform, persetujuan penerima, nomor tujuan, dan template yang sesuai. Tetap gunakan pemeriksaan akses dan antrean pengiriman yang sama.

Referensi: [App Password Google](https://support.google.com/accounts/answer/185833), [SMTP Gmail](https://support.google.com/mail/answer/7104828), [antrean Laravel](https://laravel.com/docs/13.x/queues).
