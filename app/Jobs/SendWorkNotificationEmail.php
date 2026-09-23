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

        $url = route('projects.overview', $project);
        if ($notification->type === TaskAssignedNotification::class) {
            $task = Task::query()->assignedTo($user)->where('project_id', $project->id)
                ->where('task_number', $data['task_number'] ?? 0)->first();
            if (! $task) {
                return;
            }
            $url = route('projects.list', ['project' => $project, 'task' => $task->task_number]);
        }

        Notification::route('mail', $user->notification_email)->notify(new WorkEmailNotification(
            $data['title'], $data['message'], $url,
        ));
    }
}
