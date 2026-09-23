<?php

namespace App\Http\Controllers;

use App\Enums\ProjectHealth;
use App\Enums\ProjectMemberRole;
use App\Enums\ProjectStatus;
use App\Enums\StatusCategory;
use App\Enums\TaskPriority;
use App\Http\Requests\DeleteProjectRequest;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\ActivityLog;
use App\Models\Attachment;
use App\Models\Comment;
use App\Models\Project;
use App\Models\ProjectDeletion;
use App\Models\Task;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\ProjectService;
use App\Support\InertiaData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Project::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string'],
            'health' => ['nullable', 'string'],
        ]);

        $projects = Project::query()
            ->accessibleTo($request->user())
            ->active()
            ->with(['owner'])
            ->withCount('members')
            ->withProgressCounts()
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $term = '%'.mb_strtolower($search).'%';
                $query->where(fn (Builder $query) => $query
                    ->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(key) LIKE ?', [$term]));
            })
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $query->where('status', $status))
            ->when($filters['health'] ?? null, fn (Builder $query, string $health) => $query->where('health', $health))
            ->orderByDesc('updated_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Project $project) => InertiaData::project($project));

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'filters' => $filters,
            'projectStatuses' => $this->enumOptions(ProjectStatus::cases()),
            'projectHealth' => $this->enumOptions(ProjectHealth::cases()),
            'owners' => $request->user()->isAdmin()
                ? User::query()->whereNull('removed_at')->where('is_active', true)->orderBy('name')->get()->map(fn (User $user) => InertiaData::user($user))
                : [],
            'canCreate' => $request->user()->can('create', Project::class),
        ]);
    }

    public function store(StoreProjectRequest $request, ProjectService $service): RedirectResponse
    {
        $project = $service->create($request->validated(), $request->user());

        return to_route('projects.list', $project)->with('success', 'Proyek berhasil dibuat.');
    }

    public function overview(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);
        $project->load(['owner', 'members'])
            ->loadCount([
                'tasks as total_tasks_count' => fn (Builder $query) => $query->whereNull('archived_at'),
                'tasks as completed_tasks_count' => fn (Builder $query) => $query
                    ->whereNull('archived_at')
                    ->whereHas('status', fn (Builder $status) => $status->where('category', StatusCategory::Done->value)),
            ]);

        $today = today();
        $openTasks = $project->tasks()->active()
            ->whereHas('status', fn (Builder $query) => $query->where('category', '!=', StatusCategory::Done->value));

        $statuses = $project->statuses()
            ->withCount(['tasks' => fn (Builder $query) => $query->whereNull('archived_at')])
            ->get();

        $recentActivity = $project->activityLogs()
            ->with('actor')
            ->limit(12)
            ->get()
            ->map(fn (ActivityLog $activity) => InertiaData::activity($activity));

        return Inertia::render('projects/overview', [
            ...$this->projectContext($request, $project),
            'metrics' => [
                'open' => (clone $openTasks)->count(),
                'overdue' => (clone $openTasks)->whereDate('due_date', '<', $today)->count(),
                'due_soon' => (clone $openTasks)->whereBetween('due_date', [$today, $today->copy()->addDays(7)])->count(),
            ],
            'tasksByStatus' => $statuses->map(fn ($status) => InertiaData::status($status)),
            'recentActivity' => $recentActivity,
        ]);
    }

    public function list(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);
        $filters = $this->taskFilters($request);
        $query = Task::query()->whereBelongsTo($project)->active()->with(['project', 'status', 'assignees', 'labels', 'creator'])->withCount('comments');
        $this->applyTaskFilters($query, $filters);
        $this->applyTaskSort($query, $filters['sort'] ?? 'updated', $filters['direction'] ?? 'desc');

        $tasks = $query->paginate(60)
            ->withQueryString()
            ->through(fn (Task $task) => InertiaData::task($task));

        return Inertia::render('projects/list', [
            ...$this->projectContext($request, $project),
            'tasks' => $tasks,
            'filters' => $filters,
            'selectedTask' => $this->selectedTask($request, $project),
            'priorityOptions' => $this->enumOptions(TaskPriority::cases()),
        ]);
    }

    public function board(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);
        $filters = $this->taskFilters($request);
        $query = Task::query()->whereBelongsTo($project)->active()->with(['project', 'status', 'assignees', 'labels', 'creator'])->withCount('comments');
        $this->applyTaskFilters($query, $filters);

        $total = (clone $query)->count();
        $tasks = $query->orderBy('status_id')->orderBy('position')->orderBy('id')
            ->limit(500)
            ->get()
            ->map(fn (Task $task) => InertiaData::task($task));

        return Inertia::render('projects/board', [
            ...$this->projectContext($request, $project),
            'tasks' => $tasks,
            'filters' => $filters,
            'boardTruncated' => $total > 500,
            'selectedTask' => $this->selectedTask($request, $project),
            'priorityOptions' => $this->enumOptions(TaskPriority::cases()),
        ]);
    }

    public function activity(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $activity = $project->activityLogs()
            ->with('actor')
            ->paginate(50)
            ->through(fn (ActivityLog $log) => InertiaData::activity($log));

        return Inertia::render('projects/activity', [
            ...$this->projectContext($request, $project),
            'activity' => $activity,
        ]);
    }

    public function update(
        UpdateProjectRequest $request,
        Project $project,
        ActivityLogger $activity,
    ): RedirectResponse {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request, $project, $activity): void {
            $oldOwnerId = $project->owner_id;
            $project->fill($data)->save();

            if (isset($data['owner_id']) && $data['owner_id'] !== $oldOwnerId) {
                $project->members()->syncWithoutDetaching([
                    $oldOwnerId => ['role' => ProjectMemberRole::Manager->value],
                    $data['owner_id'] => ['role' => ProjectMemberRole::Owner->value],
                ]);
            }

            $activity->record($request->user(), $project, $project, 'project.updated', [
                'description' => "{$request->user()->name} memperbarui pengaturan proyek.",
            ]);
        });

        return to_route('projects.settings', $project->fresh())->with('success', 'Pengaturan proyek berhasil diperbarui.');
    }

    public function archive(Request $request, Project $project, ActivityLogger $activity): RedirectResponse
    {
        $this->authorize('archive', $project);

        $project->update([
            'status' => ProjectStatus::Archived,
            'archived_at' => now(),
        ]);
        $activity->record($request->user(), $project, $project, 'project.archived', [
            'description' => "{$request->user()->name} mengarsipkan {$project->name}.",
        ]);

        return to_route('projects.index')->with('success', 'Proyek berhasil diarsipkan.');
    }

    public function destroy(DeleteProjectRequest $request, Project $project): RedirectResponse
    {
        $attachmentPaths = $project->tasks()
            ->join('attachments', 'attachments.task_id', '=', 'tasks.id')
            ->pluck('attachments.storage_path')
            ->all();

        $summary = [
            'tasks' => $project->tasks()->count(),
            'comments' => Comment::query()->whereHas('task', fn (Builder $query) => $query->where('project_id', $project->id))->count(),
            'attachments' => count($attachmentPaths),
            'members' => $project->members()->count(),
        ];

        DB::transaction(function () use ($request, $project, $summary): void {
            ProjectDeletion::create([
                'actor_id' => $request->user()->id,
                'project_id' => $project->id,
                'project_key' => $project->key,
                'project_name' => $project->name,
                'reason' => $request->validated('reason'),
                'summary' => $summary,
                'deleted_at' => now(),
            ]);

            DB::table('notifications')
                ->whereRaw("(data::jsonb ->> 'project_key') = ?", [$project->key])
                ->delete();

            // Tasks must be removed first because their statuses use a restrictive FK.
            $project->tasks()->delete();
            $project->delete();
        });

        if ($attachmentPaths !== []) {
            Storage::delete($attachmentPaths);
        }

        return to_route('projects.index')->with('success', 'Proyek berhasil dihapus permanen.');
    }

    /** @return array<string, mixed> */
    private function projectContext(Request $request, Project $project): array
    {
        $project->loadMissing([
            'owner',
            'members',
            'statuses' => fn ($query) => $query->withCount(['tasks' => fn (Builder $tasks) => $tasks->whereNull('archived_at')]),
            'labels',
        ])
            ->loadCount([
                'members',
                'tasks as total_tasks_count' => fn (Builder $query) => $query->whereNull('archived_at'),
                'tasks as completed_tasks_count' => fn (Builder $query) => $query
                    ->whereNull('archived_at')
                    ->whereHas('status', fn (Builder $status) => $status->where('category', StatusCategory::Done->value)),
            ]);

        return [
            'project' => InertiaData::project($project, true),
            'statuses' => $project->statuses->map(fn ($status) => InertiaData::status($status)),
            'members' => $project->members->map(fn (User $member) => InertiaData::user($member))->values(),
            'labels' => $project->labels->map(fn ($label) => [
                'id' => $label->id,
                'name' => $label->name,
                'color' => $label->color,
            ])->values(),
            'permissions' => [
                'updateProject' => $request->user()->can('update', $project),
                'manageMembers' => $request->user()->can('manageMembers', $project),
                'manageWorkflow' => $request->user()->can('manageWorkflow', $project),
                'createTask' => $request->user()->can('create', [Task::class, $project]),
                'archiveProject' => $request->user()->can('archive', $project),
                'deleteProject' => $request->user()->can('delete', $project),
            ],
        ];
    }

    /** @return array<string, mixed>|null */
    private function selectedTask(Request $request, Project $project): ?array
    {
        if (! $request->filled('task')) {
            return null;
        }

        $task = $project->tasks()
            ->where('task_number', $request->integer('task'))
            ->with([
                'project',
                'status',
                'assignees',
                'labels',
                'creator',
                'comments.author',
                'attachments.uploader',
            ])
            ->firstOrFail();

        $data = InertiaData::task($task, true);
        $data['activity'] = ActivityLog::query()
            ->where('project_id', $project->id)
            ->where('subject_type', $task->getMorphClass())
            ->where('subject_id', $task->id)
            ->with('actor')
            ->latest('created_at')
            ->limit(50)
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

    /** @return array<string, mixed> */
    private function taskFilters(Request $request): array
    {
        return $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'integer'],
            'priority' => ['nullable', 'string'],
            'assignee' => ['nullable', 'integer'],
            'label' => ['nullable', 'integer'],
            'due' => ['nullable', 'in:overdue,today,week,no_date'],
            'sort' => ['nullable', 'in:updated,created,due,priority,task_id,position'],
            'direction' => ['nullable', 'in:asc,desc'],
        ]);
    }

    /**
     * @param  Builder<Task>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyTaskFilters(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function (Builder $query, string $search): void {
            $number = preg_match('/-(\d+)$/', $search, $matches) ? (int) $matches[1] : null;
            $term = '%'.mb_strtolower($search).'%';
            $query->where(fn (Builder $query) => $query
                ->whereRaw('LOWER(title) LIKE ?', [$term])
                ->when($number, fn (Builder $query) => $query->orWhere('task_number', $number)));
        });
        $query->when($filters['status'] ?? null, fn (Builder $query, int $status) => $query->where('status_id', $status));
        $query->when($filters['priority'] ?? null, fn (Builder $query, string $priority) => $query->where('priority', $priority));
        $query->when($filters['assignee'] ?? null, fn (Builder $query, int $assignee) => $query->whereHas('assignees', fn (Builder $users) => $users->whereKey($assignee)));
        $query->when($filters['label'] ?? null, fn (Builder $query, int $label) => $query->whereHas('labels', fn (Builder $labels) => $labels->whereKey($label)));

        match ($filters['due'] ?? null) {
            'overdue' => $query->whereDate('due_date', '<', today())->whereHas('status', fn (Builder $status) => $status->where('category', '!=', StatusCategory::Done->value)),
            'today' => $query->whereDate('due_date', today()),
            'week' => $query->whereBetween('due_date', [today(), today()->addDays(7)]),
            'no_date' => $query->whereNull('due_date'),
            default => null,
        };
    }

    /** @param Builder<Task> $query */
    private function applyTaskSort(Builder $query, string $sort, string $direction): void
    {
        $direction = $direction === 'asc' ? 'asc' : 'desc';

        match ($sort) {
            'created' => $query->orderBy('created_at', $direction),
            'due' => $query->orderByRaw('due_date IS NULL')->orderBy('due_date', $direction),
            'priority' => $direction === 'asc'
                ? $query->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 ELSE 5 END asc")
                : $query->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 ELSE 5 END desc"),
            'task_id' => $query->orderBy('task_number', $direction),
            'position' => $query->orderBy('position', $direction),
            default => $query->orderBy('updated_at', $direction),
        };
    }

    /**
     * @param  array<int, ProjectStatus|ProjectHealth|TaskPriority>  $cases
     * @return list<array{value: string, label: string}>
     */
    private function enumOptions(array $cases): array
    {
        return array_values(array_map(fn ($case) => ['value' => $case->value, 'label' => $case->label()], $cases));
    }
}
