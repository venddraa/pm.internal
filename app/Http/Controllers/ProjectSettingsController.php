<?php

namespace App\Http\Controllers;

use App\Enums\ProjectHealth;
use App\Enums\ProjectMemberRole;
use App\Enums\ProjectStatus;
use App\Enums\StatusCategory;
use App\Models\Project;
use App\Models\User;
use App\Support\InertiaData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectSettingsController extends Controller
{
    public function __invoke(Request $request, Project $project): Response
    {
        $this->authorize('update', $project);
        $project->load([
            'owner',
            'members',
            'statuses' => fn ($query) => $query->withCount('tasks'),
            'labels' => fn ($query) => $query->withCount('tasks'),
        ])
            ->loadCount([
                'members',
                'tasks as total_tasks_count' => fn (Builder $query) => $query->whereNull('archived_at'),
                'tasks as completed_tasks_count' => fn (Builder $query) => $query
                    ->whereNull('archived_at')
                    ->whereHas('status', fn (Builder $status) => $status->where('category', StatusCategory::Done->value)),
            ]);

        return Inertia::render('projects/settings', [
            'project' => InertiaData::project($project, true),
            'statuses' => $project->statuses->map(fn ($status) => InertiaData::status($status)),
            'labels' => $project->labels->map(fn ($label) => [
                'id' => $label->id,
                'name' => $label->name,
                'color' => $label->color,
                'task_count' => $label->tasks_count,
            ]),
            'availableUsers' => User::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => InertiaData::user($user)),
            'projectStatuses' => $this->options(ProjectStatus::cases()),
            'projectHealth' => $this->options(ProjectHealth::cases()),
            'memberRoles' => $this->options(array_filter(
                ProjectMemberRole::cases(),
                fn ($role) => $role !== ProjectMemberRole::Owner,
            )),
            'statusCategories' => $this->options(StatusCategory::cases()),
            'permissions' => [
                'manageMembers' => $request->user()->can('manageMembers', $project),
                'manageWorkflow' => $request->user()->can('manageWorkflow', $project),
                'archiveProject' => $request->user()->can('archive', $project),
            ],
        ]);
    }

    /**
     * @param  array<int, ProjectStatus|ProjectHealth|ProjectMemberRole|StatusCategory>  $cases
     * @return list<array{value: string, label: string}>
     */
    private function options(array $cases): array
    {
        return array_values(array_map(
            fn ($case) => ['value' => $case->value, 'label' => $case->label()],
            $cases,
        ));
    }
}
