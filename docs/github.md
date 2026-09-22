# Push pertama dan kolaborasi pm-internal

## Pemilik repository

1. Di GitHub, buat repository **pm-internal**, pilih **Private** untuk source aplikasi internal.
2. Buat repository kosong: jangan centang README, .gitignore, atau license karena sudah tersedia di project.
3. Dari terminal di folder project, jalankan command berikut. Ganti `USERNAME_GITHUB` dengan username GitHub kamu:

```bash
git init -b main
git add .
git status --short
git diff --cached --stat
```

Periksa daftar sebelum commit: `.env`, `vendor`, `node_modules`, `public/hot`, log, upload, dump database, dan password akun internal tidak boleh ikut. `.env.example`, `composer.lock`, dan `package-lock.json` justru harus ikut. Bila Git meminta identitas, isi `git config user.name "Nama Kamu"` dan `git config user.email "EMAIL_GITHUB_KAMU"` (boleh email noreply dari pengaturan GitHub).

```bash
git commit -m "Initial commit: pm-internal"
git remote add origin https://github.com/USERNAME_GITHUB/pm-internal.git
git push -u origin main
```

Autentikasi HTTPS menggunakan credential manager atau token GitHub ketika diminta, bukan password akun GitHub. Jangan menaruh token dalam URL remote atau file project. SSH juga bisa digunakan jika key sudah dikonfigurasi.

Jika `origin` sudah ada, periksa `git remote -v` dan gunakan `git remote set-url origin URL_REPOSITORY_YANG_BENAR`, bukan menambah ulang. Jika repository telanjur berisi commit, jangan force-push: sinkronkan histori terlebih dahulu.

4. Buka **Settings → Collaborators**, undang akun GitHub Adit, lalu Adit menerima undangannya.
5. Adit mengikuti [README](../README.md#setup-pertama-untuk-adit--clone-baru).

## Alur kerja berdua

Mulai fitur dari main terbaru:

```bash
git switch main
git pull --ff-only
git switch -c feat/nama-fitur
```

Setelah implementasi dan pemeriksaan yang relevan selesai:

```bash
git add path/file-yang-diubah
git commit -m "Jelaskan perubahan"
git push -u origin feat/nama-fitur
```

Buka pull request ke `main`, minta satu sama lain melakukan review, lalu merge. Jangan mengerjakan fitur berbeda langsung di main. Sertakan migration untuk perubahan skema dan commit lockfile saat dependency berubah; jangan mengirim database lokal atau folder dependency.

Desain login saat ini sudah disepakati untuk dipertahankan. Diskusikan dahulu jika fitur mengharuskan perubahan desain tersebut.

Referensi resmi: [menambahkan source lokal ke GitHub](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
