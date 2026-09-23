<?php

namespace Tests\Feature;

use App\Enums\ProjectMemberRole;
use App\Models\Attachment;
use App\Models\Comment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommentsAndAttachmentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_member_can_create_edit_and_delete_own_comment(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($member)->post(route('comments.store', [$project, $task]), [
            'content' => 'Please verify the monthly report totals.',
        ])->assertSessionHasNoErrors();

        $comment = Comment::firstOrFail();
        $this->actingAs($member)->patch(route('comments.update', [$project, $task, $comment]), [
            'content' => 'Please verify the monthly report totals and source data.',
        ])->assertSessionHasNoErrors();
        $this->assertNotNull($comment->fresh()->edited_at);

        $this->actingAs($member)->delete(route('comments.destroy', [$project, $task, $comment]))->assertSessionHasNoErrors();
        $this->assertSoftDeleted($comment);
    }

    public function test_other_user_cannot_edit_comment_but_team_can_comment(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $outsider = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $task = $this->makeTask($project, $owner);
        $comment = Comment::create(['task_id' => $task->id, 'author_id' => $owner->id, 'content' => 'Owner note']);

        $this->actingAs($member)->patch(route('comments.update', [$project, $task, $comment]), ['content' => 'Changed'])->assertForbidden();
        $this->actingAs($outsider)->post(route('comments.store', [$project, $task]), ['content' => 'Team note'])->assertSessionHasNoErrors();
        $this->assertSame('Owner note', $comment->fresh()->content);
        $this->assertDatabaseHas('comments', ['task_id' => $task->id, 'author_id' => $outsider->id, 'content' => 'Team note']);
    }

    public function test_authorized_attachment_upload_and_download_are_protected(): void
    {
        Storage::fake('local');
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $outsider = $this->makeUser();
        $project = $this->makeProject($owner, [[$member, ProjectMemberRole::Member]]);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($member)->post(route('attachments.store', [$project, $task]), [
            'file' => UploadedFile::fake()->create('monthly-report.pdf', 120, 'application/pdf'),
        ])->assertSessionHasNoErrors();

        $attachment = Attachment::firstOrFail();
        Storage::disk('local')->assertExists($attachment->storage_path);
        $this->actingAs($member)->get(route('attachments.download', [$project, $task, $attachment]))->assertOk();
        $this->actingAs($outsider)->get(route('attachments.download', [$project, $task, $attachment]))->assertOk();
    }

    public function test_attachment_type_validation_and_viewer_upload_denial(): void
    {
        Storage::fake('local');
        $owner = $this->makeUser();
        $viewer = $this->makeUser();
        $project = $this->makeProject($owner, [[$viewer, ProjectMemberRole::Viewer]]);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($owner)->post(route('attachments.store', [$project, $task]), [
            'file' => UploadedFile::fake()->create('payload.exe', 12, 'application/octet-stream'),
        ])->assertSessionHasErrors('file');

        $this->actingAs($viewer)->post(route('attachments.store', [$project, $task]), [
            'file' => UploadedFile::fake()->create('note.txt', 2, 'text/plain'),
        ])->assertForbidden();
    }
}
