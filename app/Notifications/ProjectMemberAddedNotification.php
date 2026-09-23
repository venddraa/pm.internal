<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ProjectMemberAddedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Project $project,
        private readonly User $actor,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Ditambahkan ke pekerjaan',
            'message' => "{$this->actor->name} menambahkan kamu ke {$this->project->name}.",
            'project_key' => $this->project->key,
            'url' => route('projects.overview', $this->project, false),
        ];
    }
}
