<?php

namespace App\Http\Controllers;

use App\Enums\StatusCategory;
use App\Http\Requests\ProjectStatusRequest;
use App\Models\Project;
use App\Models\ProjectStatusRecord;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class WorkflowStatusController extends Controller
{
    public function reorder(Request $request, Project $project): RedirectResponse
    {
        $this->authorize('manageWorkflow', $project);
        $validated = $request->validate([
            'ordered_ids' => ['required', 'array', 'min:1'],
            'ordered_ids.*' => ['required', 'integer', 'distinct', Rule::exists('project_statuses', 'id')->where('project_id', $project->id)],
        ]);

        $currentIds = $project->statuses()->pluck('id')->map(static fn (mixed $id): int => (int) $id)->sort()->values()->all();
        /** @var array<int, int> $orderedIds */
        $orderedIds = $validated['ordered_ids'];
        $submittedIds = collect($orderedIds)->sort()->values()->all();
        if ($currentIds !== $submittedIds) {
            throw ValidationException::withMessages(['ordered_ids' => 'Urutan lengkap alur kerja proyek wajib dikirim.']);
        }

        DB::transaction(function () use ($orderedIds, $project): void {
            Project::query()->whereKey($project->id)->lockForUpdate()->firstOrFail();
            foreach ($orderedIds as $position => $statusId) {
                ProjectStatusRecord::query()->whereKey($statusId)->update(['position' => $position]);
            }
        });

        return back()->with('success', 'Urutan alur kerja berhasil diperbarui.');
    }

    public function store(ProjectStatusRequest $request, Project $project): RedirectResponse
    {
        $position = $request->input('position') ?? (((int) $project->statuses()->max('position')) + 1);
        $project->statuses()->create([
            ...$request->safe()->only(['name', 'color', 'category']),
            'position' => $position,
        ]);

        return back()->with('success', 'Status kerja berhasil ditambahkan.');
    }

    public function update(
        ProjectStatusRequest $request,
        Project $project,
        ProjectStatusRecord $status,
    ): RedirectResponse {
        $status->update($request->safe()->only(['name', 'color', 'category', 'position']));

        if ($request->has('category')) {
            $done = $request->string('category')->value() === StatusCategory::Done->value;
            $status->tasks()->whereNull('archived_at')->update([
                'completed_at' => $done ? now() : null,
            ]);
        }

        return back()->with('success', 'Status kerja berhasil diperbarui.');
    }

    public function destroy(
        Request $request,
        Project $project,
        ProjectStatusRecord $status,
        ActivityLogger $activity,
    ): RedirectResponse {
        $this->authorize('manageWorkflow', $project);
        $validated = $request->validate(['replacement_status_id' => ['nullable', 'integer']]);

        DB::transaction(function () use ($validated, $request, $project, $status, $activity): void {
            Project::query()->whereKey($project->id)->lockForUpdate()->firstOrFail();
            $taskCount = $status->tasks()->count();

            if ($taskCount > 0) {
                $replacement = ProjectStatusRecord::query()
                    ->where('project_id', $project->id)
                    ->whereKey($validated['replacement_status_id'] ?? null)
                    ->whereKeyNot($status->id)
                    ->first();

                if (! $replacement) {
                    throw ValidationException::withMessages([
                        'replacement_status_id' => 'Pilih status pengganti sebelum menghapus status yang masih berisi tugas.',
                    ]);
                }

                $status->tasks()->each(function ($task) use ($replacement): void {
                    $task->update([
                        'status_id' => $replacement->id,
                        'completed_at' => $replacement->category === StatusCategory::Done
                            ? ($task->completed_at ?? now())
                            : null,
                    ]);
                });
            }

            $name = $status->name;
            $status->delete();
            $activity->record($request->user(), $project, $project, 'workflow.status_deleted', [
                'description' => "{$request->user()->name} menghapus status kerja {$name}.",
            ]);
        });

        return back()->with('success', 'Status kerja berhasil dihapus.');
    }
}
