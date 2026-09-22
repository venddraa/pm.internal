<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Support\InertiaData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $validated = $request->validate(['q' => ['nullable', 'string', 'max:120']]);
        $search = trim($validated['q'] ?? '');

        $projects = collect();
        $tasks = collect();

        if (mb_strlen($search) >= 2) {
            $term = '%'.mb_strtolower($search).'%';
            $projects = Project::query()
                ->accessibleTo($request->user())
                ->active()
                ->with('owner')
                ->withCount('members')
                ->withProgressCounts()
                ->where(fn (Builder $query) => $query
                    ->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(key) LIKE ?', [$term]))
                ->limit(12)
                ->get()
                ->map(fn (Project $project) => InertiaData::project($project));

            $referenceNumber = preg_match('/^([A-Za-z][A-Za-z0-9]*)-(\d+)$/', $search, $matches)
                ? (int) $matches[2]
                : null;
            $referenceKey = $matches[1] ?? null;

            $tasks = Task::query()
                ->active()
                ->whereHas('project', fn (Builder $project) => $project->accessibleTo($request->user())->active())
                ->with(['project', 'status', 'assignees', 'labels'])
                ->where(function (Builder $query) use ($term, $referenceNumber, $referenceKey): void {
                    $query->whereRaw('LOWER(title) LIKE ?', [$term]);
                    if ($referenceNumber !== null) {
                        $query->orWhere(fn (Builder $reference) => $reference
                            ->where('task_number', $referenceNumber)
                            ->whereHas('project', fn (Builder $project) => $project->whereRaw('LOWER(key) = ?', [mb_strtolower((string) $referenceKey)])));
                    }
                })
                ->limit(20)
                ->get()
                ->map(fn (Task $task) => InertiaData::task($task));
        }

        return Inertia::render('search/index', [
            'query' => $search,
            'projects' => $projects,
            'tasks' => $tasks,
        ]);
    }
}
