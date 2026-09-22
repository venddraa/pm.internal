<?php

namespace Tests\Feature;

use App\Enums\ProjectMemberRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PersonalWorkOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_includes_assigned_tasks_without_dates_and_beyond_next_week(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $undated = $this->makeTask($project, $owner, ['assignee_ids' => [$member->id]]);
        $undated->update(['due_date' => null]);
        $future = $this->makeTask($project, $owner, ['assignee_ids' => [$member->id], 'due_date' => today()->addDays(30)->toDateString()]);
        $this->makeTask($project, $owner, ['assignee_ids' => [$owner->id]]);
        $done = $project->statuses()->where('category', 'done')->firstOrFail();

        $this->actingAs($member)->get('/home')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('home/index')
            ->where('summary.open', 2)
            ->has('taskSections.no_date', 1)
            ->where('taskSections.no_date.0.id', $undated->id)
            ->where('taskSections.no_date.0.completion_status_id', $done->id)
            ->where('taskSections.upcoming.0.id', $future->id)
            ->where('navigation.my_tasks_count', 2)
            ->where('navigation.can_create_project', false));
    }

    public function test_my_tasks_defaults_to_open_and_completed_tasks_have_their_own_view(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $open = $this->makeTask($project, $owner, ['assignee_ids' => [$owner->id]]);
        $done = $this->makeTask($project, $owner, ['assignee_ids' => [$owner->id], 'status_name' => 'DONE']);
        $this->actingAs($owner)->get('/my-tasks')->assertInertia(fn (Assert $page) => $page
            ->where('filters.state', 'open')->where('tasks.total', 1)->where('tasks.data.0.id', $open->id)
            ->where('summary.open', 1)->where('summary.completed', 1)->where('summary.all', 2));
        $this->get('/my-tasks?state=completed')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.total', 1)->where('tasks.data.0.id', $done->id));
        $this->get('/my-tasks?state=all')->assertInertia(fn (Assert $page) => $page->where('tasks.total', 2));
    }

    public function test_viewer_cannot_complete_tasks_from_personal_work(): void
    {
        $owner = $this->makeUser();
        $viewer = $this->makeUser();
        $project = $this->makeProject($owner, [[$viewer, ProjectMemberRole::Viewer]]);
        $task = $this->makeTask($project, $owner, ['assignee_ids' => [$viewer->id]]);
        $done = $project->statuses()->where('category', 'done')->firstOrFail();
        $this->actingAs($viewer)->get('/my-tasks')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.data.0.completion_status_id', null));
        $this->patch(route('tasks.update', [$project, $task]), ['status_id' => $done->id])->assertForbidden();
    }

    public function test_removed_members_and_archived_projects_are_excluded_from_personal_work(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $this->makeTask($project, $owner, ['assignee_ids' => [$member->id]]);
        $project->members()->detach($member);
        $this->actingAs($member)->get('/my-tasks?state=all')->assertInertia(fn (Assert $page) => $page->where('tasks.total', 0));
        $project->members()->attach($member, ['role' => ProjectMemberRole::Member->value]);
        $project->update(['archived_at' => now()]);
        $this->get('/home')->assertInertia(fn (Assert $page) => $page->where('summary.open', 0)->where('navigation.my_tasks_count', 0));
    }

    public function test_assignee_can_complete_reopen_and_comment_using_personal_task_links(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $task = $this->makeTask($project, $owner, ['assignee_ids' => [$member->id]]);
        $done = $project->statuses()->where('category', 'done')->firstOrFail();
        $this->actingAs($member)->from('/my-tasks')->patch(route('tasks.update', [$project, $task]), ['status_id' => $done->id])->assertRedirect('/my-tasks');
        $this->assertNotNull($task->fresh()->completed_at);
        $this->get('/my-tasks')->assertInertia(fn (Assert $page) => $page->where('tasks.total', 0)->where('summary.completed', 1));
        $open = $project->statuses()->where('category', 'todo')->firstOrFail();
        $this->patch(route('tasks.update', [$project, $task]), ['status_id' => $open->id])->assertSessionHasNoErrors();
        $this->assertNull($task->fresh()->completed_at);
        $this->post(route('comments.store', [$project, $task]), ['content' => 'Pekerjaan siap ditinjau.'])->assertSessionHasNoErrors();
        $this->get('/my-tasks')->assertInertia(fn (Assert $page) => $page->where('tasks.data.0.comments_count', 1));
    }
}
