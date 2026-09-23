<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WorkEmailNotification extends Notification
{
    /**
     * @param array<string, mixed>|null $details
     */
    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly string $url,
        public readonly ?array $details = null,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $recipientName = property_exists($notifiable, 'name') && filled($notifiable->name)
            ? (string) $notifiable->name
            : 'Rekan Kerja';

        return (new MailMessage)
            ->subject('[PM Internal] '.$this->title)
            ->view('emails.work_notification', [
                'recipientName' => $recipientName,
                'title' => $this->title,
                'bodyMessage' => $this->message,
                'url' => $this->url,
                'details' => $this->details,
            ]);
    }
}
