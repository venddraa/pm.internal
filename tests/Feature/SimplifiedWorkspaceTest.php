<?php

namespace Tests\Feature;

use App\Enums\GlobalUserRole;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SimplifiedWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_team_member_can_monitor_every_work_item(): void
    {
        $owner = $this->makeUser();
        $colleague = $this->makeUser();
        $project = $this->makeProject($owner);

        $this->actingAs($colleague)
            ->get(route('projects.list', $project))
            ->assertOk();
    }

    public function test_manager_can_create_work_with_simple_default_progress(): void
    {
        $manager = $this->makeUser(GlobalUserRole::Manager);
        $owner = $this->makeUser();

        $this->actingAs($manager)->post(route('projects.store'), [
            'name' => 'Audit Bank Indonesia',
            'key' => 'ABI',
            'owner_id' => $owner->id,
            'progress_mode' => 'checklist',
        ])->assertSessionHasNoErrors();

        $project = Project::query()->where('key', 'ABI')->firstOrFail();
        $this->assertSame('checklist', $project->progress_mode);
        $this->assertSame(5, $project->statuses()->count());
    }

    public function test_numeric_progress_is_aggregated_from_scope_rows(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $project->update([
            'progress_mode' => 'numeric',
            'target_value' => 700,
            'progress_unit' => 'titik',
        ]);

        $this->actingAs($owner)->post(route('project-progress-items.store', $project), [
            'name' => 'Ruas Jagorawi',
            'target_value' => 300,
            'completed_value' => 180,
            'assignee_id' => $owner->id,
        ])->assertSessionHasNoErrors();

        $this->actingAs($owner)->post(route('project-progress-items.store', $project), [
            'name' => 'Ruas Jakarta–Cikampek',
            'target_value' => 400,
            'completed_value' => 243,
        ])->assertSessionHasNoErrors();

        $this->assertSame([
            'total' => 700,
            'completed' => 423,
            'open' => 277,
            'percent' => 60,
        ], $project->fresh()->progressStats());
    }

    public function test_assignee_can_update_their_task_without_project_membership(): void
    {
        $owner = $this->makeUser();
        $assignee = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner, [
            'assignee_ids' => [$assignee->id],
        ]);
        $done = $project->statuses()->where('category', 'done')->firstOrFail();

        $this->actingAs($assignee)
            ->patch(route('tasks.update', [$project, $task]), [
                'status_id' => $done->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame($done->id, $task->fresh()->status_id);
    }

    public function test_progress_row_is_scoped_to_its_work(): void
    {
        $owner = $this->makeUser();
        $first = $this->makeProject($owner, attributes: ['key' => 'ONE']);
        $second = $this->makeProject($owner, attributes: ['key' => 'TWO']);
        $item = $first->progressItems()->create([
            'name' => 'Ruas satu',
            'target_value' => 10,
            'completed_value' => 2,
        ]);

        $this->actingAs($owner)
            ->patch(route('project-progress-items.update', [$second, $item]), [
                'completed_value' => 8,
            ])
            ->assertNotFound();

        $this->assertSame(2, $item->fresh()->completed_value);
    }
}
