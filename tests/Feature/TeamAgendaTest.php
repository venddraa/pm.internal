<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TeamAgendaTest extends TestCase
{
    use RefreshDatabase;

    public function test_team_member_can_create_work_and_assign_any_active_user(): void
    {
        $owner = $this->makeUser();
        $actor = $this->makeUser();
        $assignee = $this->makeUser();
        $project = $this->makeProject($owner);

        $this->actingAs($actor)->post(route('agenda.tasks.store'), [
            'title' => 'Survey FO gardu ruas Dalkot',
            'area_id' => $project->id,
            'description' => 'Ikut bersama Dimas dan IT OPS.',
            'status_note' => 'Menunggu konfirmasi jadwal dari area RO.',
            'scheduled_at' => '2026-09-25 09:30:00',
            'assignee_ids' => [$assignee->id],
        ])->assertSessionHasNoErrors();

        $task = Task::query()->firstOrFail();
        $this->assertSame('Survey FO gardu ruas Dalkot', $task->title);
        $this->assertSame('Menunggu konfirmasi jadwal dari area RO.', $task->status_note);
        $this->assertSame('2026-09-25 09:30:00', $task->scheduled_at?->format('Y-m-d H:i:s'));
        $this->assertDatabaseHas('task_user', [
            'task_id' => $task->id,
            'user_id' => $assignee->id,
        ]);
        $this->assertNotNull($assignee->notifications()->first());
    }

    public function test_assignee_can_record_waiting_status_result_and_next_action(): void
    {
        $owner = $this->makeUser();
        $assignee = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner, [
            'title' => 'Survey FO gardu',
            'assignee_ids' => [$assignee->id],
        ]);

        $this->actingAs($assignee)->patch(route('agenda.tasks.update', $task), [
            'agenda_status' => 'waiting',
            'status_note' => 'Menunggu jadwal dari area RO.',
            'result_notes' => "GT Halim 2\nGardu 10\n- FO spare\n- Power ada",
            'next_action' => 'Koordinasi penambahan PCCOM 4.',
            'reference_url' => 'https://example.sharepoint.com/sites/itpg/document.pdf',
        ])->assertSessionHasNoErrors();

        $task->refresh()->load('status');
        $this->assertSame('MENUNGGU', $task->status->name);
        $this->assertSame('Menunggu jadwal dari area RO.', $task->status_note);
        $this->assertStringContainsString('GT Halim 2', (string) $task->result_notes);
        $this->assertSame('Koordinasi penambahan PCCOM 4.', $task->next_action);

        $this->get(route('home', ['task' => $task->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('home/index')
                ->where('selectedTask.id', $task->id)
                ->where('selectedTask.agenda_status', 'waiting')
                ->where('tasks.data.0.status_note', 'Menunggu jadwal dari area RO.')
                ->where('selectedTask.permissions.update', true)
                ->where('selectedTask.result_notes', $task->result_notes));
    }

    public function test_unassigned_team_member_can_view_and_comment_but_cannot_edit(): void
    {
        $owner = $this->makeUser();
        $observer = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner);

        $this->actingAs($observer)
            ->get(route('home', ['task' => $task->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('selectedTask.permissions.update', false)
                ->where('selectedTask.permissions.comment', true));

        $this->patch(route('agenda.tasks.update', $task), [
            'status_note' => 'Tidak boleh diubah.',
        ])->assertForbidden();
    }

    public function test_agenda_filters_mine_today_and_done(): void
    {
        $owner = $this->makeUser();
        $member = $this->makeUser();
        $project = $this->makeProject($owner);
        $mine = $this->makeTask($project, $owner, ['assignee_ids' => [$member->id]]);
        $mine->update(['scheduled_at' => now()]);
        $this->makeTask($project, $owner, ['status_name' => 'DONE']);

        $this->actingAs($member)->get('/home?view=mine')
            ->assertInertia(fn (Assert $page) => $page->where('tasks.total', 1)->where('tasks.data.0.id', $mine->id));
        $this->get('/home?view=today')
            ->assertInertia(fn (Assert $page) => $page->where('tasks.total', 1)->where('tasks.data.0.id', $mine->id));
        $this->get('/home?view=done')
            ->assertInertia(fn (Assert $page) => $page->where('tasks.total', 1));
    }
}
