<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAgendaTaskRequest;
use App\Http\Requests\UpdateAgendaTaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use App\Support\AgendaStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class AgendaTaskController extends Controller
{
    public function store(StoreAgendaTaskRequest $request, TaskService $service): RedirectResponse
    {
        $project = Project::query()->active()->findOrFail($request->integer('area_id'));
        $scheduledAt = $request->validated('scheduled_at');
        $status = AgendaStatus::resolve($project, 'todo');

        $task = $service->create($project, [
            ...Arr::except($request->validated(), ['area_id']),
            'status_id' => $status->id,
            'due_date' => $scheduledAt ? Carbon::parse($scheduledAt)->toDateString() : null,
        ], $request->user());

        return to_route('home', ['task' => $task->id])
            ->with('success', 'Pekerjaan ditambahkan ke agenda tim.');
    }

    public function update(
        UpdateAgendaTaskRequest $request,
        Task $task,
        TaskService $service,
    ): RedirectResponse {
        abort_if($task->archived_at !== null || $task->project->archived_at !== null, 404);

        $data = $request->validated();
        if (array_key_exists('agenda_status', $data)) {
            $data['status_id'] = AgendaStatus::resolve($task->project, $data['agenda_status'])->id;
            unset($data['agenda_status']);
        }

        if (array_key_exists('scheduled_at', $data)) {
            $data['due_date'] = $data['scheduled_at']
                ? Carbon::parse($data['scheduled_at'])->toDateString()
                : null;
        }

        $service->update($task, $data, $request->user());

        return back()->with('success', 'Catatan pekerjaan diperbarui.');
    }
}
