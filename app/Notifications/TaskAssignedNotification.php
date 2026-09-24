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
            'title' => 'Pekerjaan baru untukmu',
            'message' => "{$this->actor->name} menugaskan kamu: {$this->task->title}.",
            'project_key' => $this->task->project->key,
            'task_id' => $this->task->id,
            'task_number' => $this->task->task_number,
            'url' => route('home', ['task' => $this->task->id], false),
        ];
    }
}
