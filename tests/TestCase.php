<?php

namespace Tests;

use App\Enums\GlobalUserRole;
use App\Enums\ProjectMemberRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectService;
use App\Services\TaskService;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    protected function makeUser(GlobalUserRole $role = GlobalUserRole::Member, array $attributes = []): User
    {
        return User::factory()->create([
            'role' => $role,
            'is_active' => true,
            ...$attributes,
        ]);
    }

    /** @param array<int, array{0: User, 1: ProjectMemberRole}> $members */
    protected function makeProject(User $owner, array $members = [], array $attributes = []): Project
    {
        $project = app(ProjectService::class)->create([
            'name' => $attributes['name'] ?? 'Internal Reporting Portal',
            'key' => $attributes['key'] ?? 'IRP',
            'description' => $attributes['description'] ?? 'Internal reporting work.',
            'owner_id' => $owner->id,
            'start_date' => $attributes['start_date'] ?? now()->toDateString(),
            'due_date' => $attributes['due_date'] ?? now()->addMonth()->toDateString(),
        ], $owner);

        foreach ($members as [$user, $role]) {
            $project->members()->syncWithoutDetaching([
                $user->id => ['role' => $role->value],
            ]);
        }

        return $project->fresh(['owner', 'members', 'statuses']);
    }

    protected function makeTask(Project $project, User $actor, array $attributes = []): Task
    {
        $status = isset($attributes['status_name'])
            ? $project->statuses()->where('name', $attributes['status_name'])->firstOrFail()
            : $project->statuses()->orderBy('position')->firstOrFail();

        return app(TaskService::class)->create($project, [
            'title' => $attributes['title'] ?? 'Prepare database schema',
            'description' => $attributes['description'] ?? 'Define relational tables and constraints.',
            'status_id' => $status->id,
            'priority' => $attributes['priority'] ?? 'normal',
            'start_date' => $attributes['start_date'] ?? null,
            'due_date' => $attributes['due_date'] ?? now()->addWeek()->toDateString(),
            'assignee_ids' => $attributes['assignee_ids'] ?? [],
            'label_ids' => $attributes['label_ids'] ?? [],
        ], $actor);
    }
}
