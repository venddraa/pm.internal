<?php

namespace App\Http\Controllers;

use App\Enums\StatusCategory;
use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Support\InertiaData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyTasksController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'priority' => ['nullable', 'string'],
            'project' => ['nullable', 'integer'],
            'state' => ['nullable', 'in:open,all,overdue,today,upcoming,no_date,completed'],
            'sort' => ['nullable', 'in:due,updated,priority,task_id'],
            'direction' => ['nullable', 'in:asc,desc'],
        ]);

        $user = $request->user();
        $query = Task::query()
            ->assignedTo($user)
            ->with(['project.statuses', 'project.members' => fn ($query) => $query->whereKey($user->id), 'status', 'assignees', 'labels'])
            ->withCount('comments');

        $summary = [
            'open' => (clone $query)->whereHas('status', fn (Builder $status) => $status->where('category', '!=', StatusCategory::Done->value))->count(),
            'completed' => (clone $query)->whereHas('status', fn (Builder $status) => $status->where('category', StatusCategory::Done->value))->count(),
            'all' => (clone $query)->count(),
        ];

        $query->when($filters['search'] ?? null, function (Builder $query, string $search): void {
            $term = '%'.mb_strtolower($search).'%';
            $query->whereRaw('LOWER(title) LIKE ?', [$term]);
        });
        $query->when($filters['priority'] ?? null, fn (Builder $query, string $priority) => $query->where('priority', $priority));
        $query->when($filters['project'] ?? null, fn (Builder $query, int $project) => $query->where('project_id', $project));

        $state = $filters['state'] ?? 'open';
        $filters['state'] = $state;
        match ($state) {
            'open' => $query->whereHas('status', fn (Builder $status) => $status->where('category', '!=', StatusCategory::Done->value)),
            'overdue' => $query->whereDate('due_date', '<', today())->whereHas('status', fn (Builder $status) => $status->where('category', '!=', StatusCategory::Done->value)),
            'today' => $query->whereDate('due_date', today())->whereHas('status', fn (Builder $status) => $status->where('category', '!=', StatusCategory::Done->value)),
            'upcoming' => $query->whereDate('due_date', '>', today())->whereHas('status', fn (Builder $status) => $status->where('category', '!=', StatusCategory::Done->value)),
            'no_date' => $query->whereNull('due_date')->whereHas('status', fn (Builder $status) => $status->where('category', '!=', StatusCategory::Done->value)),
            'completed' => $query->whereHas('status', fn (Builder $status) => $status->where('category', StatusCategory::Done->value)),
            default => null,
        };

        $direction = ($filters['direction'] ?? 'asc') === 'desc' ? 'desc' : 'asc';
        match ($filters['sort'] ?? 'due') {
            'updated' => $query->orderBy('updated_at', $direction),
            'priority' => $direction === 'asc'
                ? $query->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 ELSE 5 END asc")
                : $query->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 ELSE 5 END desc"),
            'task_id' => $query->orderBy('task_number', $direction),
            default => $query->orderByRaw('due_date IS NULL')->orderBy('due_date', $direction),
        };

        $tasks = $query->paginate(60)->withQueryString()->through(fn (Task $task) => InertiaData::personalTask($task, $user));
        $projects = Project::query()->accessibleTo($request->user())->active()->orderBy('name')->get(['id', 'name', 'key']);

        return Inertia::render('my-tasks/index', [
            'tasks' => $tasks,
            'summary' => $summary,
            'filters' => $filters,
            'projects' => $projects,
            'priorityOptions' => array_map(fn ($priority) => [
                'value' => $priority->value,
                'label' => $priority->label(),
            ], TaskPriority::cases()),
        ]);
    }
}
