<?php

namespace App\Jobs;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ProjectMemberAddedNotification;
use App\Notifications\TaskAssignedNotification;
use App\Notifications\WorkEmailNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class SendWorkNotificationEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    /** @var list<int> */
    public array $backoff = [60, 300, 900];

    public function __construct(public int $userId, public string $notificationId) {}

    public function handle(): void
    {
        $user = User::find($this->userId);
        if (! $user || ! $user->canReceiveWorkEmail()) {
            return;
        }

        $notification = $user->notifications()->find($this->notificationId);
        if (! $notification || ! in_array($notification->type, [TaskAssignedNotification::class, ProjectMemberAddedNotification::class], true)) {
            return;
        }

        $data = $notification->data;
        $project = Project::query()->active()->accessibleTo($user)
            ->where('key', $data['project_key'] ?? '')->first();
        if (! $project) {
            return;
        }

        if ($notification->type === ProjectMemberAddedNotification::class
            && ! $project->members()->whereKey($user->id)->exists()) {
            return;
        }

        $url = route('projects.overview', $project);
        $details = [
            'type' => 'project_member',
            'project_name' => $project->name,
            'project_key' => $project->key,
        ];

        if ($notification->type === TaskAssignedNotification::class) {
            $task = Task::query()->assignedTo($user)->where('project_id', $project->id)
                ->where('task_number', $data['task_number'] ?? 0)
                ->with(['creator', 'status'])
                ->first();
            if (! $task) {
                return;
            }
            $url = route('projects.list', ['project' => $project, 'task' => $task->task_number]);

            $priorityValue = $task->priority->value;

            $details = [
                'type' => 'task_assigned',
                'project_name' => $project->name,
                'project_key' => $project->key,
                'task_reference' => $task->reference,
                'task_title' => $task->title,
                'creator_name' => $task->creator->name,
                'priority' => $priorityValue,
                'priority_label' => match ($priorityValue) {
                    'urgent' => 'Mendesak (Urgent)',
                    'high' => 'Tinggi (High)',
                    'normal' => 'Normal',
                    'low' => 'Rendah (Low)',
                    default => 'Normal',
                },
                'priority_color' => match ($priorityValue) {
                    'urgent' => '#dc2626',
                    'high' => '#ea580c',
                    'normal' => '#64748b',
                    'low' => '#2563eb',
                    default => '#64748b',
                },
                'status_name' => $task->status->name,
                'status_color' => $task->status->color,
                'start_date' => $task->start_date ? $task->start_date->translatedFormat('d M Y') : null,
                'due_date' => $task->due_date ? $task->due_date->translatedFormat('d M Y') : null,
                'description' => $task->description ? Str::limit($task->description, 350) : null,
            ];
        }

        Notification::route('mail', $user->notification_email)->notify(new WorkEmailNotification(
            $data['title'], $data['message'], $url, $details,
        ));
    }
}
