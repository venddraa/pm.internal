<?php

namespace Tests\Feature;

use App\Enums\ProjectMemberRole;
use App\Models\ProjectStatusRecord;
use App\Notifications\TaskAssignedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkflowSearchAndInboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_status_with_tasks_requires_valid_replacement_before_deletion(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $backlog = $project->statuses()->where('name', 'BACKLOG')->firstOrFail();
        $todo = $project->statuses()->where('name', 'TO DO')->firstOrFail();
        $task = $this->makeTask($project, $owner, ['status_name' => 'BACKLOG']);

        $this->actingAs($owner)
            ->delete(route('workflow-statuses.destroy', [$project, $backlog]))
            ->assertSessionHasErrors('replacement_status_id');
        $this->assertNotNull(ProjectStatusRecord::find($backlog->id));

        $this->actingAs($owner)
            ->delete(route('workflow-statuses.destroy', [$project, $backlog]), ['replacement_status_id' => $todo->id])
            ->assertSessionHasNoErrors();

        $this->assertNull(ProjectStatusRecord::find($backlog->id));
        $this->assertSame($todo->id, $task->fresh()->status_id);
    }

    public function test_project_labels_can_be_created_updated_and_deleted(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);

        $this->actingAs($owner)->post(route('labels.store', $project), [
            'name' => 'Backend',
            'color' => '#2563eb',
        ])->assertSessionHasNoErrors();
        $label = $project->labels()->firstOrFail();

        $this->actingAs($owner)->patch(route('labels.update', [$project, $label]), [
            'name' => 'API',
            'color' => '#1d4ed8',
        ])->assertSessionHasNoErrors();
        $this->assertSame('API', $label->fresh()->name);

        $this->actingAs($owner)->delete(route('labels.destroy', [$project, $label]))->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('labels', ['id' => $label->id]);
    }

    public function test_global_search_finds_team_work_for_every_active_user(): void
    {
        $owner = $this->makeUser();
        $outsider = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner, ['title' => 'Create reporting endpoint']);

        $this->actingAs($owner)->get(route('search', ['q' => $task->reference]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('search/index')
                ->has('tasks', 1)
                ->where('tasks.0.reference', 'IRP-1'));

        $this->actingAs($outsider)->get(route('search', ['q' => $task->reference]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('tasks', 1)
                ->where('tasks.0.reference', 'IRP-1'));
    }

    public function test_assignment_creates_database_notification_and_inbox_can_mark_it_read(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);

        $task = $this->makeTask($project, $owner, [
            'title' => 'Validate monthly report',
            'assignee_ids' => [$member->id],
        ]);

        $notification = $member->notifications()->firstOrFail();
        $this->assertSame(TaskAssignedNotification::class, $notification->type);

        $this->actingAs($member)
            ->patch(route('inbox.read', $notification->id))
            ->assertSessionHasNoErrors();
        $this->assertNotNull($notification->fresh()->read_at);
        $this->assertSame('IRP-1', $task->reference);
    }

    public function test_my_tasks_due_state_is_filtered_server_side(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $this->makeTask($project, $owner, ['title' => 'Overdue assignment', 'due_date' => now()->subDay()->toDateString(), 'assignee_ids' => [$member->id]]);
        $this->makeTask($project, $owner, ['title' => 'Upcoming assignment', 'due_date' => now()->addWeek()->toDateString(), 'assignee_ids' => [$member->id]]);

        $this->actingAs($member)->get(route('my-tasks', ['state' => 'overdue']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('my-tasks/index')
                ->where('tasks.total', 1)
                ->where('tasks.data.0.title', 'Overdue assignment'));
    }
}
