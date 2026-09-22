<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoveTaskRequest;
use App\Models\Project;
use App\Models\ProjectStatusRecord;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;

class TaskMoveController extends Controller
{
    public function __invoke(
        MoveTaskRequest $request,
        Project $project,
        Task $task,
        TaskService $service,
    ): RedirectResponse {
        $status = ProjectStatusRecord::query()
            ->where('project_id', $project->id)
            ->findOrFail($request->integer('status_id'));

        $service->move($task, $status, $request->integer('target_index'), $request->user());

        return back();
    }
}
