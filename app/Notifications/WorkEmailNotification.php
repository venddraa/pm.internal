<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkEmailNotification extends Notification
{
    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly string $url,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[PM Internal] '.$this->title)
            ->greeting('Halo!')
            ->line($this->message)
            ->action('Buka ruang kerja', $this->url)
            ->line('Email ini dikirim karena ada aktivitas pekerjaan untuk akunmu. Preferensi email dapat diubah di Pengaturan → Profil.')
            ->salutation('IT Planning & Governance Department');
    }
}
