<?php

namespace App\Http\Controllers;

use App\Enums\StatusCategory;
use App\Models\Project;
use App\Models\Task;
use App\Support\InertiaData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $base = Task::query()
            ->assignedTo($user)
            ->whereHas('status', fn (Builder $query) => $query->where('category', '!=', StatusCategory::Done->value))
            ->with(['project.statuses', 'project.members' => fn ($query) => $query->whereKey($user->id), 'status', 'assignees', 'labels'])
            ->withCount('comments');

        $today = today();
        $taskSections = [
            'overdue' => (clone $base)->whereDate('due_date', '<', $today)->orderBy('due_date')->limit(8)->get(),
            'today' => (clone $base)->whereDate('due_date', $today)->orderBy('priority')->limit(8)->get(),
            'upcoming' => (clone $base)->whereDate('due_date', '>', $today)->orderBy('due_date')->limit(5)->get(),
            'no_date' => (clone $base)->whereNull('due_date')->latest('updated_at')->limit(5)->get(),
        ];

        $projects = Project::query()
            ->accessibleTo($user)
            ->active()
            ->where('status', 'active')
            ->with('owner')
            ->withCount('members')
            ->withProgressCounts()
            ->latest('updated_at')
            ->limit(6)
            ->get();

        return Inertia::render('home/index', [
            'taskSections' => collect($taskSections)->map(fn ($tasks) => $tasks->map(fn (Task $task) => InertiaData::personalTask($task, $user))),
            'projects' => $projects->map(fn (Project $project) => InertiaData::project($project)),
            'summary' => [
                'open' => (clone $base)->count(),
                'no_date' => (clone $base)->whereNull('due_date')->count(),
                'overdue' => (clone $base)->whereDate('due_date', '<', $today)->count(),
                'today' => (clone $base)->whereDate('due_date', $today)->count(),
                'upcoming' => (clone $base)->whereBetween('due_date', [$today->copy()->addDay(), $today->copy()->addDays(7)])->count(),
            ],
        ]);
    }
}
