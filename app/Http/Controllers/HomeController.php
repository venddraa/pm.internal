<?php

namespace App\Http\Controllers;

use App\Enums\StatusCategory;
use App\Models\ActivityLog;
use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Project;
use App\Models\ProjectStatusRecord;
use App\Models\Task;
use App\Models\User;
use App\Support\AgendaStatus;
use App\Support\InertiaData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'view' => ['nullable', 'in:all,mine,today,waiting,done'],
            'search' => ['nullable', 'string', 'max:120'],
            'area' => ['nullable', 'integer'],
            'person' => ['nullable', 'integer'],
            'task' => ['nullable', 'integer'],
        ]);
        $filters['view'] = $filters['view'] ?? 'all';

        $base = Task::query()
            ->active()
            ->whereHas('project', fn (Builder $projects) => $projects->active());

        $query = (clone $base)
            ->with(['project', 'status', 'assignees', 'creator'])
            ->withCount('comments');

        match ($filters['view']) {
            'mine' => $query
                ->whereHas('assignees', fn (Builder $users) => $users->whereKey($request->user()->id))
                ->whereHas('status', fn (Builder $statuses) => $statuses->where('category', '!=', StatusCategory::Done->value)),
            'today' => $query
                ->whereDate('scheduled_at', today())
                ->whereHas('status', fn (Builder $statuses) => $statuses->where('category', '!=', StatusCategory::Done->value)),
            'waiting' => $query->whereHas('status', fn (Builder $statuses) => $this->waitingStatus($statuses)),
            'done' => $query->whereHas('status', fn (Builder $statuses) => $statuses->where('category', StatusCategory::Done->value)),
            default => $query->whereHas('status', fn (Builder $statuses) => $statuses->where('category', '!=', StatusCategory::Done->value)),
        };

        $query->when($filters['search'] ?? null, function (Builder $tasks, string $search): void {
            $term = '%'.mb_strtolower($search).'%';
            $tasks->where(fn (Builder $task) => $task
                ->whereRaw('LOWER(title) LIKE ?', [$term])
                ->orWhereRaw('LOWER(COALESCE(description, \'\')) LIKE ?', [$term])
                ->orWhereRaw('LOWER(COALESCE(status_note, \'\')) LIKE ?', [$term])
                ->orWhereRaw('LOWER(COALESCE(result_notes, \'\')) LIKE ?', [$term])
                ->orWhereRaw('LOWER(COALESCE(next_action, \'\')) LIKE ?', [$term]));
        });
        $query->when($filters['area'] ?? null, fn (Builder $tasks, int $area) => $tasks->where('project_id', $area));
        $query->when($filters['person'] ?? null, fn (Builder $tasks, int $person) => $tasks
            ->whereHas('assignees', fn (Builder $users) => $users->whereKey($person)));

        $tasks = $query
            ->orderByRaw('scheduled_at IS NULL')
            ->orderBy('scheduled_at')
            ->orderByDesc('updated_at')
            ->paginate(60)
            ->withQueryString()
            ->through(fn (Task $task) => InertiaData::task($task));

        $open = (clone $base)->whereHas('status', fn (Builder $statuses) => $statuses->where('category', '!=', StatusCategory::Done->value));

        return Inertia::render('home/index', [
            'tasks' => $tasks,
            'filters' => $filters,
            'areas' => Project::query()->active()->orderBy('name')->get(['id', 'name', 'key']),
            'people' => User::query()
                ->whereNull('removed_at')
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => InertiaData::user($user)),
            'stats' => [
                'open' => (clone $open)->count(),
                'mine' => (clone $open)->whereHas('assignees', fn (Builder $users) => $users->whereKey($request->user()->id))->count(),
                'today' => (clone $open)->whereDate('scheduled_at', today())->count(),
                'waiting' => (clone $open)->whereHas('status', fn (Builder $statuses) => $this->waitingStatus($statuses))->count(),
                'unassigned' => (clone $open)->doesntHave('assignees')->count(),
            ],
            'selectedTask' => $this->selectedTask($request),
            'statusOptions' => AgendaStatus::OPTIONS,
            'canCreate' => $request->user()->is_active && Project::query()->active()->exists(),
        ]);
    }

    /** @param Builder<ProjectStatusRecord> $query */
    private function waitingStatus(Builder $query): void
    {
        $query->where('category', StatusCategory::InProgress->value)
            ->where(function (Builder $names): void {
                $names->whereRaw('LOWER(name) LIKE ?', ['%menunggu%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%waiting%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%blocked%'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%tertahan%']);
            });
    }

    /** @return array<string, mixed>|null */
    private function selectedTask(Request $request): ?array
    {
        if (! $request->filled('task')) {
            return null;
        }

        $task = Task::query()
            ->active()
            ->whereHas('project', fn (Builder $projects) => $projects->active())
            ->with([
                'project',
                'status',
                'assignees',
                'creator',
                'comments.author',
                'attachments.uploader',
            ])
            ->findOrFail($request->integer('task'));

        $this->authorize('view', $task);

        $data = InertiaData::task($task, true);
        $data['activity'] = ActivityLog::query()
            ->where('project_id', $task->project_id)
            ->where('subject_type', $task->getMorphClass())
            ->where('subject_id', $task->id)
            ->with('actor')
            ->latest('created_at')
            ->limit(30)
            ->get()
            ->map(fn (ActivityLog $log) => InertiaData::activity($log));
        $data['permissions'] = [
            'update' => $request->user()->can('update', $task),
            'archive' => $request->user()->can('archive', $task),
            'comment' => $request->user()->can('create', [Comment::class, $task]),
            'attach' => $request->user()->can('create', [Attachment::class, $task]),
        ];

        return $data;
    }
}
