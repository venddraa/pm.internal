<?php

namespace Tests\Feature;

use App\Enums\GlobalUserRole;
use App\Enums\ProjectMemberRole;
use App\Enums\StatusCategory;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\ProjectDeletion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_project_with_default_workflow_and_owner_membership(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);
        $owner = $this->makeUser();

        $response = $this->actingAs($admin)->post(route('projects.store'), [
            'name' => 'Operation Monitoring Dashboard',
            'key' => 'omd',
            'description' => 'Monitor operation indicators.',
            'owner_id' => $owner->id,
            'start_date' => '2026-09-01',
            'due_date' => '2026-12-01',
        ]);

        $project = Project::where('key', 'OMD')->firstOrFail();
        $response->assertRedirect(route('projects.list', $project));
        $this->assertSame(5, $project->statuses()->count());
        $this->assertDatabaseHas('project_user', [
            'project_id' => $project->id,
            'user_id' => $owner->id,
            'role' => ProjectMemberRole::Owner->value,
        ]);
    }

    public function test_project_input_is_validated(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);

        $this->actingAs($admin)->post(route('projects.store'), [
            'name' => '',
            'key' => 'not valid',
            'owner_id' => 999999,
            'start_date' => '2026-10-10',
            'due_date' => '2026-09-01',
        ])->assertSessionHasErrors(['name', 'key', 'owner_id', 'due_date']);
    }

    public function test_owner_can_add_member_and_change_project_role(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner);

        $this->actingAs($owner)->post(route('project-members.store', $project), [
            'user_id' => $member->id,
            'role' => ProjectMemberRole::Member->value,
        ])->assertSessionHasNoErrors();

        $this->actingAs($owner)->post(route('project-members.store', $project), [
            'user_id' => $member->id,
            'role' => ProjectMemberRole::Manager->value,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('project_user', [
            'project_id' => $project->id,
            'user_id' => $member->id,
            'role' => ProjectMemberRole::Manager->value,
        ]);
    }

    public function test_owner_transfer_updates_membership_roles(): void
    {
        $owner = $this->makeUser();
        $replacement = $this->makeUser();
        $project = $this->makeProject($owner, [[$replacement, ProjectMemberRole::Manager]]);

        $this->actingAs($owner)->patch(route('projects.update', $project), [
            'owner_id' => $replacement->id,
        ])->assertSessionHasNoErrors();

        $this->assertSame($replacement->id, $project->fresh()->owner_id);
        $this->assertDatabaseHas('project_user', ['project_id' => $project->id, 'user_id' => $replacement->id, 'role' => 'owner']);
        $this->assertDatabaseHas('project_user', ['project_id' => $project->id, 'user_id' => $owner->id, 'role' => 'manager']);
    }

    public function test_progress_uses_status_category_instead_of_status_name(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $done = $project->statuses()->where('category', StatusCategory::Done->value)->firstOrFail();
        $done->update(['name' => 'CLOSED']);

        $this->makeTask($project, $owner, ['status_name' => 'CLOSED', 'title' => 'Completed task']);
        $this->makeTask($project, $owner, ['status_name' => 'TO DO', 'title' => 'Open task']);

        $this->assertSame([
            'total' => 2,
            'completed' => 1,
            'open' => 1,
            'percent' => 50,
        ], $project->progressStats());
    }

    public function test_project_key_must_be_unique(): void
    {
        $owner = $this->makeUser();
        $admin = $this->makeUser(GlobalUserRole::Admin);
        $this->makeProject($owner, attributes: ['key' => 'DUP']);

        $this->actingAs($admin)->post(route('projects.store'), [
            'name' => 'Duplicate Key Project',
            'key' => 'dup',
            'owner_id' => $owner->id,
        ])->assertSessionHasErrors('key');
    }

    public function test_only_admin_can_permanently_delete_project_with_reason(): void
    {
        Storage::fake('local');
        $admin = $this->makeUser(GlobalUserRole::Admin);
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner);
        $path = "attachments/{$project->id}/{$task->id}/test.pdf";
        Storage::disk('local')->put($path, 'test');
        Attachment::create([
            'task_id' => $task->id,
            'uploaded_by' => $owner->id,
            'original_name' => 'test.pdf',
            'storage_path' => $path,
            'mime_type' => 'application/pdf',
            'file_size' => 4,
        ]);

        $this->actingAs($owner)->delete(route('projects.destroy', $project), [
            'reason' => 'Proyek dummy tidak diperlukan.',
            'confirmation' => $project->key,
        ])->assertForbidden();

        $this->actingAs($admin)->delete(route('projects.destroy', $project), [
            'reason' => 'Proyek dummy tidak diperlukan.',
            'confirmation' => $project->key,
        ])->assertRedirect(route('projects.index'));

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
        Storage::disk('local')->assertMissing($path);
        $deletion = ProjectDeletion::firstOrFail();
        $this->assertSame('Proyek dummy tidak diperlukan.', $deletion->reason);
        $this->assertSame($project->key, $deletion->project_key);
        $this->assertSame(1, $deletion->summary['tasks']);
        $this->assertSame(1, $deletion->summary['attachments']);
    }

    public function test_permanent_project_delete_requires_reason_and_matching_key(): void
    {
        $admin = $this->makeUser(GlobalUserRole::Admin);
        $project = $this->makeProject($admin);

        $this->actingAs($admin)->delete(route('projects.destroy', $project), [
            'reason' => 'short',
            'confirmation' => 'WRONG',
        ])->assertSessionHasErrors(['reason', 'confirmation']);

        $this->assertNotNull($project->fresh());
    }
}
