<?php

namespace App\Http\Middleware;

use App\Models\Project;
use App\Models\Task;
use App\Support\InertiaData;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => fn () => [
                'user' => $request->user() ? InertiaData::user($request->user()) : null,
            ],
            'navigation' => fn () => $request->user() ? [
                'can_create_project' => $request->user()->can('create', Project::class),
                'my_tasks_count' => Task::query()->assignedTo($request->user())->whereHas('status', fn ($query) => $query->where('category', '!=', 'done'))->count(),
                'projects' => Project::query()
                    ->accessibleTo($request->user())
                    ->active()
                    ->with(['members' => fn ($query) => $query->whereKey($request->user()->id)])
                    ->orderBy('name')
                    ->limit(30)
                    ->get(['id', 'name', 'key'])
                    ->map(fn (Project $project) => [
                        'id' => $project->id,
                        'name' => $project->name,
                        'key' => $project->key,
                        'can_create_task' => $request->user()->isAdmin()
                            || ($project->members->first()?->pivot->role ?? null) !== 'viewer',
                    ]),
                'unread_count' => $request->user()->unreadNotifications()->count(),
                'notifications' => $request->user()->notifications()
                    ->limit(5)
                    ->get()
                    ->map(fn ($notification) => InertiaData::notification($notification)),
            ] : ['projects' => [], 'unread_count' => 0, 'notifications' => []],
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
