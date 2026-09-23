<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\WorkEmailNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class TestWorkEmail extends Command
{
    protected $signature = 'notifications:test-email {login : Account login ID} {--send : Actually send via configured SMTP}';

    protected $description = 'Preview a work email, or send an explicit SMTP test to a configured pilot account';

    public function handle(): int
    {
        $user = User::where('email', $this->argument('login'))->first();
        if (! $user || ! $user->is_active || ! $user->notification_email) {
            $this->error('Akun aktif dengan email notifikasi tidak ditemukan.');

            return self::FAILURE;
        }

        $this->info('Penerima: '.$user->notification_email);
        $this->info('Subjek: [PM Internal] Uji notifikasi email');
        if (! $this->option('send')) {
            $this->info('Preview saja. Tidak ada email dikirim. Gunakan --send setelah SMTP dikonfigurasi.');

            return self::SUCCESS;
        }

        if (! $user->canReceiveWorkEmail() || config('mail.default') !== 'smtp'
            || ! config('mail.mailers.smtp.username') || ! config('mail.mailers.smtp.password')) {
            $this->error('Aktifkan WORK_EMAIL_ENABLED, allowlist penerima, dan kredensial SMTP terlebih dahulu.');

            return self::FAILURE;
        }

        Notification::route('mail', $user->notification_email)->notify(new WorkEmailNotification(
            'Uji notifikasi email',
            'Ini adalah uji pengiriman PM Internal. Tidak ada tugas atau proyek yang diubah.',
            route('home'),
        ));
        $this->info('Email diterima oleh transport SMTP. Periksa inbox/spam penerima untuk memastikan pengiriman.');

        return self::SUCCESS;
    }
}
