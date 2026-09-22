<?php

namespace App\Http\Controllers;

use App\Http\Requests\LabelRequest;
use App\Models\Label;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;

class LabelController extends Controller
{
    public function store(LabelRequest $request, Project $project): RedirectResponse
    {
        $project->labels()->create($request->validated());

        return back()->with('success', 'Label berhasil dibuat.');
    }

    public function update(LabelRequest $request, Project $project, Label $label): RedirectResponse
    {
        $label->update($request->validated());

        return back()->with('success', 'Label berhasil diperbarui.');
    }

    public function destroy(Project $project, Label $label): RedirectResponse
    {
        $this->authorize('manageWorkflow', $project);
        $label->tasks()->detach();
        $label->delete();

        return back()->with('success', 'Label berhasil dihapus.');
    }
}
