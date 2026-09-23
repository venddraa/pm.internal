<?php

namespace App\Http\Controllers;

use App\Enums\StatusCategory;
use App\Http\Requests\ProjectProgressItemRequest;
use App\Models\Project;
use App\Models\ProjectProgressItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ProjectProgressItemController extends Controller
{
    public function store(ProjectProgressItemRequest $request, Project $project): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $project): void {
            $project->progressItems()->create([
                ...$data,
                'status' => $this->resolvedStatus($data),
                'position' => ((int) $project->progressItems()->max('position')) + 1,
            ]);
            $project->update(['last_progress_update_at' => now()]);
        });

        return back()->with('success', 'Cakupan progres berhasil ditambahkan.');
    }

    public function update(
        ProjectProgressItemRequest $request,
        Project $project,
        ProjectProgressItem $progressItem,
    ): RedirectResponse {
        $data = $request->validated();

        DB::transaction(function () use ($data, $project, $progressItem): void {
            $progressItem->update([
                ...$data,
                'status' => $this->resolvedStatus($data, $progressItem),
            ]);
            $project->update(['last_progress_update_at' => now()]);
        });

        return back()->with('success', 'Progres berhasil diperbarui.');
    }

    public function destroy(ProjectProgressItemRequest $request, Project $project, ProjectProgressItem $progressItem): RedirectResponse
    {
        $progressItem->delete();
        $project->update(['last_progress_update_at' => now()]);

        return back()->with('success', 'Cakupan progres berhasil dihapus.');
    }

    /** @param array<string, mixed> $data */
    private function resolvedStatus(array $data, ?ProjectProgressItem $item = null): string
    {
        $target = (int) ($data['target_value'] ?? ($item ? $item->target_value : 0));
        $completed = (int) ($data['completed_value'] ?? ($item ? $item->completed_value : 0));

        if ($target > 0 && $completed >= $target) {
            return StatusCategory::Done->value;
        }

        if ($completed > 0) {
            return StatusCategory::InProgress->value;
        }

        return (string) ($data['status'] ?? ($item ? $item->status->value : StatusCategory::Todo->value));
    }
}
