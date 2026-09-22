<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Services\ActivityLogger;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(
        StoreTaskRequest $request,
        Project $project,
        TaskService $service,
    ): RedirectResponse {
        $task = $service->create($project, $request->validated(), $request->user());

        return back()->with([
            'success' => "{$task->reference} created.",
            'created_task_number' => $task->task_number,
        ]);
    }

    public function update(
        UpdateTaskRequest $request,
        Project $project,
        Task $task,
        TaskService $service,
    ): RedirectResponse {
        $service->update($task, $request->validated(), $request->user());

        return back()->with('success', 'Tugas berhasil diperbarui.');
    }

    public function archive(
        Request $request,
        Project $project,
        Task $task,
        ActivityLogger $activity,
    ): RedirectResponse {
        $this->authorize('archive', $task);
        $task->update(['archived_at' => now()]);
        $activity->record($request->user(), $project, $task, 'task.archived', [
            'description' => "{$request->user()->name} mengarsipkan {$task->reference}.",
        ]);

        return back()->with('success', 'Tugas berhasil diarsipkan.');
    }
}
