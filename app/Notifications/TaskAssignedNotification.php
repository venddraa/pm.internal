<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Task $task,
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
            'title' => 'Tugas baru untukmu',
            'message' => "{$this->actor->name} menugaskan kamu pada {$this->task->reference}.",
            'project_key' => $this->task->project->key,
            'task_number' => $this->task->task_number,
            'url' => route('projects.list', [
                'project' => $this->task->project,
                'task' => $this->task->task_number,
            ], false),
        ];
    }
}
