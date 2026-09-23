<?php

namespace App\Listeners;

use App\Jobs\SendWorkNotificationEmail;
use App\Models\User;
use App\Notifications\ProjectMemberAddedNotification;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Notifications\Events\NotificationSent;

class QueueWorkNotificationEmail
{
    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'database'
            || ! $event->notifiable instanceof User
            || ! $event->notifiable->canReceiveWorkEmail()
            || ! ($event->notification instanceof TaskAssignedNotification
                || $event->notification instanceof ProjectMemberAddedNotification)) {
            return;
        }

        SendWorkNotificationEmail::dispatch($event->notifiable->id, $event->notification->id)
            ->onQueue('emails')->afterCommit();
    }
}
