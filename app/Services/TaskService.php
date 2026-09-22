<?php

namespace App\Services;

use App\Enums\StatusCategory;
use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\ProjectStatusRecord;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class TaskService
{
    private const POSITION_STEP = 1024;

    public function __construct(private readonly ActivityLogger $activity) {}

    /** @param array<string, mixed> $data */
    public function create(Project $project, array $data, User $actor): Task
    {
        $task = DB::transaction(function () use ($project, $data, $actor): Task {
            $lockedProject = Project::query()->whereKey($project->id)->lockForUpdate()->firstOrFail();
            $status = ProjectStatusRecord::query()
                ->where('project_id', $project->id)
                ->whereKey($data['status_id'] ?? $project->statuses()->orderBy('position')->value('id'))
                ->firstOrFail();

            $number = $lockedProject->next_task_number;
            $lockedProject->increment('next_task_number');

            $position = ((int) Task::query()
                ->where('project_id', $project->id)
                ->where('status_id', $status->id)
                ->whereNull('archived_at')
                ->max('position')) + self::POSITION_STEP;

            $task = Task::create([
                ...Arr::only($data, ['title', 'description', 'priority', 'start_date', 'due_date']),
                'project_id' => $project->id,
                'task_number' => $number,
                'status_id' => $status->id,
                'priority' => $data['priority'] ?? TaskPriority::None->value,
                'created_by' => $actor->id,
                'position' => $position,
                'completed_at' => $status->category === StatusCategory::Done ? now() : null,
            ]);

            $task->assignees()->sync($data['assignee_ids'] ?? []);
            $task->labels()->sync($data['label_ids'] ?? []);

            $this->activity->record($actor, $project, $task, 'task.created', [
                'task_reference' => $project->key.'-'.$number,
                'description' => "{$actor->name} membuat {$project->key}-{$number}.",
            ]);

            return $task;
        });

        $this->notifyNewAssignees($task, [], $actor);

        return $task->load(['project', 'status', 'assignees', 'labels', 'creator']);
    }

    /** @param array<string, mixed> $data */
    public function update(Task $task, array $data, User $actor): Task
    {
        $previousAssignees = array_values($task->assignees()
            ->pluck('users.id')
            ->map(static fn (mixed $id): int => (int) $id)
            ->values()
            ->all());

        DB::transaction(function () use ($task, $data, $actor): void {
            Project::query()->whereKey($task->project_id)->lockForUpdate()->firstOrFail();
            $task->refresh()->load(['project', 'status']);

            $changes = [];
            $attributes = Arr::only($data, [
                'title',
                'description',
                'priority',
                'start_date',
                'due_date',
            ]);

            if (array_key_exists('status_id', $data)) {
                $status = ProjectStatusRecord::query()
                    ->where('project_id', $task->project_id)
                    ->whereKey($data['status_id'])
                    ->firstOrFail();
                $oldStatus = $task->status;
                $attributes['status_id'] = $status->id;
                $attributes['completed_at'] = $status->category === StatusCategory::Done
                    ? ($task->completed_at ?? now())
                    : null;

                if ($oldStatus->id !== $status->id) {
                    $changes[] = [
                        'event' => 'task.status_changed',
                        'description' => "{$actor->name} mengubah status dari {$oldStatus->name} menjadi {$status->name}.",
                        'from' => $oldStatus->name,
                        'to' => $status->name,
                    ];

                    if ($oldStatus->category !== StatusCategory::Done && $status->category === StatusCategory::Done) {
                        $changes[] = [
                            'event' => 'task.completed',
                            'description' => "{$actor->name} menyelesaikan {$task->reference}.",
                        ];
                    } elseif ($oldStatus->category === StatusCategory::Done && $status->category !== StatusCategory::Done) {
                        $changes[] = [
                            'event' => 'task.reopened',
                            'description' => "{$actor->name} membuka kembali {$task->reference}.",
                        ];
                    }
                }
            }

            foreach ($attributes as $field => $value) {
                $old = $task->getAttribute($field);
                if ($field === 'priority' && $old instanceof TaskPriority) {
                    $old = $old->value;
                }
                if (! in_array($field, ['status_id', 'completed_at'], true) && (string) $old !== (string) $value) {
                    $label = str_replace('_', ' ', $field);
                    $changes[] = [
                        'event' => 'task.'.$field.'_changed',
                        'description' => "{$actor->name} mengubah {$label} pada {$task->reference}.",
                        'from' => $old,
                        'to' => $value,
                    ];
                }
            }

            $task->fill($attributes)->save();

            if (array_key_exists('assignee_ids', $data)) {
                $sync = $task->assignees()->sync($data['assignee_ids']);
                if ($sync['attached'] || $sync['detached']) {
                    $changes[] = [
                        'event' => 'task.assignees_changed',
                        'description' => "{$actor->name} memperbarui penanggung jawab {$task->reference}.",
                    ];
                }
            }

            if (array_key_exists('label_ids', $data)) {
                $sync = $task->labels()->sync($data['label_ids']);
                if ($sync['attached'] || $sync['detached']) {
                    $changes[] = [
                        'event' => 'task.labels_changed',
                        'description' => "{$actor->name} memperbarui label {$task->reference}.",
                    ];
                }
            }

            foreach ($changes as $change) {
                $this->activity->record($actor, $task->project, $task, $change['event'], $change);
            }
        });

        $this->notifyNewAssignees($task, $previousAssignees, $actor);

        return $task->refresh()->load(['project', 'status', 'assignees', 'labels', 'creator']);
    }

    public function move(Task $task, ProjectStatusRecord $targetStatus, int $targetIndex, User $actor): Task
    {
        DB::transaction(function () use ($task, $targetStatus, $targetIndex, $actor): void {
            Project::query()->whereKey($task->project_id)->lockForUpdate()->firstOrFail();
            $task->refresh()->load(['project', 'status']);
            $sourceStatus = $task->status;

            $targetIds = array_values(Task::query()
                ->where('project_id', $task->project_id)
                ->where('status_id', $targetStatus->id)
                ->whereNull('archived_at')
                ->whereKeyNot($task->id)
                ->orderBy('position')
                ->orderBy('id')
                ->pluck('id')
                ->map(static fn (mixed $id): int => (int) $id)
                ->values()
                ->all());

            $targetIndex = max(0, min($targetIndex, count($targetIds)));
            array_splice($targetIds, $targetIndex, 0, [$task->id]);

            $task->update([
                'status_id' => $targetStatus->id,
                'completed_at' => $targetStatus->category === StatusCategory::Done
                    ? ($task->completed_at ?? now())
                    : null,
            ]);

            $this->resequence($targetIds);

            if ($sourceStatus->id !== $targetStatus->id) {
                $sourceIds = array_values(Task::query()
                    ->where('project_id', $task->project_id)
                    ->where('status_id', $sourceStatus->id)
                    ->whereNull('archived_at')
                    ->orderBy('position')
                    ->orderBy('id')
                    ->pluck('id')
                    ->map(static fn (mixed $id): int => (int) $id)
                    ->values()
                    ->all());
                $this->resequence($sourceIds);

                $this->activity->record($actor, $task->project, $task, 'task.status_changed', [
                    'description' => "{$actor->name} memindahkan {$task->reference} dari {$sourceStatus->name} ke {$targetStatus->name}.",
                    'from' => $sourceStatus->name,
                    'to' => $targetStatus->name,
                ]);

                if ($sourceStatus->category !== StatusCategory::Done && $targetStatus->category === StatusCategory::Done) {
                    $this->activity->record($actor, $task->project, $task, 'task.completed', [
                        'description' => "{$actor->name} menyelesaikan {$task->reference}.",
                    ]);
                } elseif ($sourceStatus->category === StatusCategory::Done && $targetStatus->category !== StatusCategory::Done) {
                    $this->activity->record($actor, $task->project, $task, 'task.reopened', [
                        'description' => "{$actor->name} membuka kembali {$task->reference}.",
                    ]);
                }
            }
        });

        return $task->refresh()->load(['project', 'status', 'assignees', 'labels']);
    }

    /** @param list<int> $taskIds */
    private function resequence(array $taskIds): void
    {
        foreach ($taskIds as $index => $taskId) {
            Task::query()->whereKey($taskId)->update([
                'position' => ($index + 1) * self::POSITION_STEP,
            ]);
        }
    }

    /** @param list<int> $previousAssigneeIds */
    private function notifyNewAssignees(Task $task, array $previousAssigneeIds, User $actor): void
    {
        $task->loadMissing(['assignees', 'project']);
        $newAssignees = $task->assignees
            ->whereNotIn('id', $previousAssigneeIds)
            ->where('id', '!=', $actor->id);

        if ($newAssignees->isNotEmpty()) {
            Notification::send($newAssignees, new TaskAssignedNotification($task, $actor));
        }
    }
}
