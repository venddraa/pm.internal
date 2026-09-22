<?php

namespace Tests\Feature;

use App\Enums\ProjectMemberRole;
use App\Models\Task;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TaskManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_member_can_create_task_with_project_local_number(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $status = $project->statuses()->where('name', 'TO DO')->firstOrFail();

        $this->actingAs($member)->post(route('tasks.store', $project), [
            'title' => 'Create operational reporting endpoint',
            'status_id' => $status->id,
            'priority' => 'high',
            'assignee_ids' => [$member->id],
        ])->assertSessionHasNoErrors();

        $task = Task::firstOrFail();
        $this->assertSame(1, $task->task_number);
        $this->assertSame('IRP-1', $task->load('project')->reference);
        $this->assertDatabaseHas('task_user', ['task_id' => $task->id, 'user_id' => $member->id]);
    }

    public function test_task_sequence_is_atomic_counter_backed_and_project_local(): void
    {
        $owner = $this->makeUser();
        $firstProject = $this->makeProject($owner, attributes: ['key' => 'OPS']);
        $secondProject = $this->makeProject($owner, attributes: ['key' => 'DGT']);

        $first = $this->makeTask($firstProject, $owner, ['title' => 'First']);
        $second = $this->makeTask($firstProject, $owner, ['title' => 'Second']);
        $other = $this->makeTask($secondProject, $owner, ['title' => 'Other project']);

        $this->assertSame([1, 2], [$first->task_number, $second->task_number]);
        $this->assertSame(1, $other->task_number);
        $this->assertSame(3, $firstProject->fresh()->next_task_number);
        $this->assertDatabaseCount('tasks', 3);
    }

    public function test_database_rejects_duplicate_project_task_number(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner);

        $this->expectException(QueryException::class);

        DB::table('tasks')->insert([
            'project_id' => $project->id,
            'task_number' => $task->task_number,
            'title' => 'Duplicate number attempt',
            'status_id' => $task->status_id,
            'priority' => 'normal',
            'created_by' => $owner->id,
            'position' => 2048,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_task_properties_and_assignees_can_be_updated(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($member)->patch(route('tasks.update', [$project, $task]), [
            'title' => 'Updated reporting endpoint',
            'priority' => 'urgent',
            'due_date' => now()->addDays(10)->toDateString(),
            'assignee_ids' => [$owner->id, $member->id],
        ])->assertSessionHasNoErrors();

        $task->refresh();
        $this->assertSame('Updated reporting endpoint', $task->title);
        $this->assertSame('urgent', $task->priority->value);
        $this->assertEqualsCanonicalizing([$owner->id, $member->id], $task->assignees()->pluck('users.id')->all());
    }

    public function test_non_project_user_cannot_be_assigned(): void
    {
        $owner = $this->makeUser();
        $outsider = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($owner)->patch(route('tasks.update', [$project, $task]), [
            'assignee_ids' => [$outsider->id],
        ])->assertSessionHasErrors('assignee_ids');

        $this->assertDatabaseMissing('task_user', ['task_id' => $task->id, 'user_id' => $outsider->id]);
    }

    public function test_entering_done_sets_completion_and_reopening_clears_it(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner, ['status_name' => 'TO DO']);
        $done = $project->statuses()->where('name', 'DONE')->firstOrFail();
        $progress = $project->statuses()->where('name', 'IN PROGRESS')->firstOrFail();

        $this->actingAs($owner)->patch(route('tasks.update', [$project, $task]), ['status_id' => $done->id])->assertSessionHasNoErrors();
        $this->assertNotNull($task->fresh()->completed_at);

        $this->actingAs($owner)->patch(route('tasks.update', [$project, $task]), ['status_id' => $progress->id])->assertSessionHasNoErrors();
        $this->assertNull($task->fresh()->completed_at);
    }

    public function test_only_owner_or_manager_can_archive_task(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($member)->delete(route('tasks.archive', [$project, $task]))->assertForbidden();
        $this->actingAs($owner)->delete(route('tasks.archive', [$project, $task]))->assertSessionHasNoErrors();
        $this->assertNotNull($task->fresh()->archived_at);
    }
}
