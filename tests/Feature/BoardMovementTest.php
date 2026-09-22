<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoardMovementTest extends TestCase
{
    use RefreshDatabase;

    public function test_card_can_be_reordered_to_first_middle_and_last_position(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $first = $this->makeTask($project, $owner, ['title' => 'First', 'status_name' => 'TO DO']);
        $second = $this->makeTask($project, $owner, ['title' => 'Second', 'status_name' => 'TO DO']);
        $third = $this->makeTask($project, $owner, ['title' => 'Third', 'status_name' => 'TO DO']);
        $status = $project->statuses()->where('name', 'TO DO')->firstOrFail();

        $this->actingAs($owner)->patch(route('tasks.move', [$project, $third]), [
            'status_id' => $status->id,
            'target_index' => 0,
        ])->assertSessionHasNoErrors();
        $this->assertSame([$third->id, $first->id, $second->id], $this->orderedIds($project->id, $status->id));

        $this->actingAs($owner)->patch(route('tasks.move', [$project, $third]), [
            'status_id' => $status->id,
            'target_index' => 1,
        ])->assertSessionHasNoErrors();
        $this->assertSame([$first->id, $third->id, $second->id], $this->orderedIds($project->id, $status->id));

        $this->actingAs($owner)->patch(route('tasks.move', [$project, $third]), [
            'status_id' => $status->id,
            'target_index' => 2,
        ])->assertSessionHasNoErrors();
        $this->assertSame([$first->id, $second->id, $third->id], $this->orderedIds($project->id, $status->id));
    }

    public function test_card_can_move_to_empty_column_and_persists_completion_state(): void
    {
        $owner = $this->makeUser();
        $project = $this->makeProject($owner);
        $task = $this->makeTask($project, $owner, ['status_name' => 'IN PROGRESS']);
        $done = $project->statuses()->where('name', 'DONE')->firstOrFail();
        $progress = $project->statuses()->where('name', 'IN PROGRESS')->firstOrFail();

        $this->actingAs($owner)->patch(route('tasks.move', [$project, $task]), [
            'status_id' => $done->id,
            'target_index' => 0,
        ])->assertSessionHasNoErrors();

        $task->refresh();
        $this->assertSame($done->id, $task->status_id);
        $this->assertSame(1024, $task->position);
        $this->assertNotNull($task->completed_at);

        $this->actingAs($owner)->patch(route('tasks.move', [$project, $task]), [
            'status_id' => $progress->id,
            'target_index' => 0,
        ])->assertSessionHasNoErrors();
        $this->assertNull($task->fresh()->completed_at);
    }

    /** @return int[] */
    private function orderedIds(int $projectId, int $statusId): array
    {
        return Task::query()
            ->where('project_id', $projectId)
            ->where('status_id', $statusId)
            ->orderBy('position')
            ->pluck('id')
            ->all();
    }
}
