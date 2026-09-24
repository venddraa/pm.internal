<?php

namespace Tests\Feature;

use App\Enums\ProjectMemberRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PersonalWorkOverviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_is_a_shared_agenda_and_mine_filters_assignments(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $first = $this->makeTask($project, $owner, ['assignee_ids' => [$member->id]]);
        $second = $this->makeTask($project, $owner, ['assignee_ids' => [$member->id]]);
        $this->makeTask($project, $owner, ['assignee_ids' => [$owner->id]]);

        $this->actingAs($member)->get('/home')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('home/index')
            ->where('stats.open', 3)
            ->where('tasks.total', 3)
            ->where('navigation.my_tasks_count', 2)
            ->where('navigation.can_create_project', false));
        $this->get('/home?view=mine')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.total', 2)
            ->has('tasks.data', 2));
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

    public function test_assignee_can_update_work_regardless_of_old_project_role(): void
    {
        $owner = $this->makeUser();
        $viewer = $this->makeUser();
        $project = $this->makeProject($owner, [[$viewer, ProjectMemberRole::Viewer]]);
        $task = $this->makeTask($project, $owner, ['assignee_ids' => [$viewer->id]]);
        $done = $project->statuses()->where('category', 'done')->firstOrFail();
        $this->actingAs($viewer)->get('/my-tasks')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.data.0.completion_status_id', $done->id));
        $this->patch(route('tasks.update', [$project, $task]), ['status_id' => $done->id])->assertSessionHasNoErrors();
    }

    public function test_removed_members_and_archived_projects_are_excluded_from_personal_work(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $this->makeTask($project, $owner, ['assignee_ids' => [$member->id]]);
        $project->members()->detach($member);
        $this->actingAs($member)->get('/my-tasks?state=all')->assertInertia(fn (Assert $page) => $page->where('tasks.total', 1));
        $project->members()->attach($member, ['role' => ProjectMemberRole::Member->value]);
        $project->update(['archived_at' => now()]);
        $this->get('/home')->assertInertia(fn (Assert $page) => $page->where('stats.open', 0)->where('navigation.my_tasks_count', 0));
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
