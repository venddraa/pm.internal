<?php

namespace App\Support;

use App\Enums\StatusCategory;
use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\ProjectProgressItem;
use App\Models\ProjectStatusRecord;
use App\Models\Task;
use App\Models\User;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Str;

final class InertiaData
{
    /** @return array<string, mixed> */
    public static function personalTask(Task $task, User $user): array
    {
        $target = $task->status->category === StatusCategory::Done
            ? $task->project->statuses->first(fn (ProjectStatusRecord $status) => $status->category !== StatusCategory::Done)
            : $task->project->statuses->firstWhere('category', StatusCategory::Done);

        return [
            ...self::task($task),
            'completion_status_id' => $user->can('update', $task) ? $target?->id : null,
        ];
    }

    /** @return array<string, mixed> */
    public static function user(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'is_active' => $user->is_active,
            'avatar_url' => $user->avatar_path ? route('profile.avatar', $user, false) : null,
            'initials' => Str::of($user->name)
                ->explode(' ')
                ->filter()
                ->take(2)
                ->map(fn (string $part) => Str::upper(Str::substr($part, 0, 1)))
                ->implode(''),
        ];
    }

    /** @return array<string, mixed> */
    public static function project(Project $project, bool $includeMembers = false): array
    {
        if ($project->progress_mode === 'numeric') {
            $total = (int) ($project->target_value
                ?? ($project->relationLoaded('progressItems')
                    ? $project->progressItems->sum('target_value')
                    : $project->getAttribute('progress_target_sum'))
                ?? 0);
            $completed = $project->relationLoaded('progressItems')
                ? (int) $project->progressItems->sum('completed_value')
                : (int) ($project->getAttribute('progress_completed_sum') ?? 0);
            $completed = min($completed, $total);
        } else {
            $total = (int) ($project->total_tasks_count ?? 0);
            $completed = (int) ($project->completed_tasks_count ?? 0);
        }
        $data = [
            'id' => $project->id,
            'name' => $project->name,
            'key' => $project->key,
            'description' => $project->description,
            'status' => $project->status->value,
            'status_label' => $project->status->label(),
            'health' => $project->health->value,
            'health_label' => $project->health->label(),
            'progress_mode' => $project->progress_mode,
            'target_value' => $project->target_value,
            'progress_unit' => $project->progress_unit,
            'start_date' => $project->start_date?->toDateString(),
            'due_date' => $project->due_date?->toDateString(),
            'blockers' => $project->blockers,
            'next_steps' => $project->next_steps,
            'last_progress_update_at' => $project->last_progress_update_at?->toIso8601String(),
            'archived_at' => $project->archived_at?->toIso8601String(),
            'updated_at' => $project->updated_at?->toIso8601String(),
            'owner' => $project->relationLoaded('owner') ? self::user($project->owner) : null,
            'member_count' => $project->members_count ?? ($project->relationLoaded('members') ? $project->members->count() : 0),
            'progress' => [
                'total' => $total,
                'completed' => $completed,
                'open' => max(0, $total - $completed),
                'percent' => $total === 0 ? 0 : (int) round(($completed / $total) * 100),
            ],
        ];

        if ($includeMembers && $project->relationLoaded('members')) {
            $data['members'] = $project->members->map(fn (User $user) => [
                ...self::user($user),
                'project_role' => $user->pivot->getAttribute('role'),
            ])->values();
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public static function progressItem(ProjectProgressItem $item): array
    {
        $percent = $item->target_value === 0
            ? 0
            : (int) round((min($item->completed_value, $item->target_value) / $item->target_value) * 100);

        return [
            'id' => $item->id,
            'name' => $item->name,
            'target_value' => $item->target_value,
            'completed_value' => $item->completed_value,
            'percent' => $percent,
            'status' => $item->status->value,
            'status_label' => $item->status->label(),
            'due_date' => $item->due_date?->toDateString(),
            'notes' => $item->notes,
            'assignee' => $item->assignee ? self::user($item->assignee) : null,
            'updated_at' => $item->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    public static function status(ProjectStatusRecord $status): array
    {
        return [
            'id' => $status->id,
            'name' => $status->name,
            'color' => $status->color,
            'category' => $status->category->value,
            'position' => $status->position,
            'task_count' => $status->tasks_count ?? null,
        ];
    }

    /** @return array<string, mixed> */
    public static function task(Task $task, bool $detail = false): array
    {
        $data = [
            'id' => $task->id,
            'task_number' => $task->task_number,
            'reference' => $task->reference,
            'title' => $task->title,
            'description' => $task->description,
            'comments_count' => (int) ($task->comments_count ?? 0),
            'priority' => $task->priority->value,
            'priority_label' => $task->priority->label(),
            'status_id' => $task->status_id,
            'status' => $task->relationLoaded('status') ? self::status($task->status) : null,
            'project' => $task->relationLoaded('project') ? [
                'id' => $task->project->id,
                'name' => $task->project->name,
                'key' => $task->project->key,
            ] : null,
            'assignees' => $task->relationLoaded('assignees')
                ? $task->assignees->map(fn (User $user) => self::user($user))->values()
                : [],
            'labels' => $task->relationLoaded('labels')
                ? $task->labels->map(fn ($label) => [
                    'id' => $label->id,
                    'name' => $label->name,
                    'color' => $label->color,
                ])->values()
                : [],
            'start_date' => $task->start_date?->toDateString(),
            'due_date' => $task->due_date?->toDateString(),
            'position' => $task->position,
            'completed_at' => $task->completed_at?->toIso8601String(),
            'archived_at' => $task->archived_at?->toIso8601String(),
            'created_at' => $task->created_at?->toIso8601String(),
            'updated_at' => $task->updated_at?->toIso8601String(),
            'creator' => $task->relationLoaded('creator') ? self::user($task->creator) : null,
        ];

        if ($detail) {
            $data['comments'] = $task->relationLoaded('comments')
                ? $task->comments->map(fn ($comment) => [
                    'id' => $comment->id,
                    'content' => $comment->content,
                    'edited_at' => $comment->edited_at?->toIso8601String(),
                    'created_at' => $comment->created_at?->toIso8601String(),
                    'author' => self::user($comment->author),
                ])->values()
                : [];
            $data['attachments'] = $task->relationLoaded('attachments')
                ? $task->attachments->map(fn ($attachment) => [
                    'id' => $attachment->id,
                    'original_name' => $attachment->original_name,
                    'mime_type' => $attachment->mime_type,
                    'file_size' => $attachment->file_size,
                    'created_at' => $attachment->created_at?->toIso8601String(),
                    'uploader' => self::user($attachment->uploader),
                    'download_url' => route('attachments.download', [
                        'project' => $task->project,
                        'task' => $task,
                        'attachment' => $attachment,
                    ], false),
                ])->values()
                : [];
        }

        return $data;
    }

    /** @return array<string, mixed> */
    public static function activity(ActivityLog $activity): array
    {
        return [
            'id' => $activity->id,
            'event' => $activity->event,
            'metadata' => $activity->metadata,
            'created_at' => $activity->created_at->toIso8601String(),
            'actor' => $activity->actor ? self::user($activity->actor) : null,
        ];
    }

    /** @return array<string, mixed> */
    public static function notification(DatabaseNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->data['title'] ?? 'Notifikasi',
            'message' => $notification->data['message'] ?? '',
            'url' => $notification->data['url'] ?? null,
            'read_at' => $notification->read_at?->toIso8601String(),
            'created_at' => $notification->created_at?->toIso8601String(),
        ];
    }
}
