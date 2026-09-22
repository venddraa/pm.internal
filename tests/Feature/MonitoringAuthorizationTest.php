<?php

namespace Tests\Feature;

use App\Enums\ProjectMemberRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MonitoringAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_cannot_access_an_unrelated_project(): void
    {
        $owner = $this->makeUser();
        $outsider = $this->makeUser();
        $project = $this->makeProject($owner);

        $this->actingAs($outsider)
            ->get(route('projects.overview', $project))
            ->assertForbidden();
    }

    public function test_viewer_can_read_but_cannot_modify_project_or_tasks(): void
    {
        $owner = $this->makeUser();
        $viewer = $this->makeUser();
        $project = $this->makeProject($owner, [[$viewer, ProjectMemberRole::Viewer]]);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($viewer)->get(route('projects.list', $project))->assertOk();
        $this->actingAs($viewer)
            ->patch(route('projects.update', $project), ['name' => 'Unauthorized rename'])
            ->assertForbidden();
        $this->actingAs($viewer)
            ->patch(route('tasks.update', [$project, $task]), ['title' => 'Unauthorized edit'])
            ->assertForbidden();
    }

    public function test_member_cannot_access_user_administration(): void
    {
        $member = $this->makeUser();

        $this->actingAs($member)->get(route('admin.users.index'))->assertForbidden();
    }

    public function test_nested_task_binding_blocks_cross_project_idor(): void
    {
        $owner = $this->makeUser();
        $first = $this->makeProject($owner, attributes: ['key' => 'ONE']);
        $second = $this->makeProject($owner, attributes: ['key' => 'TWO']);
        $secondTask = $this->makeTask($second, $owner);

        $this->actingAs($owner)
            ->patch("/projects/{$first->key}/tasks/{$secondTask->task_number}", ['title' => 'Cross-project edit'])
            ->assertNotFound();

        $this->assertSame('Prepare database schema', $secondTask->fresh()->title);
    }
}
