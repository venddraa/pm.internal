<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectMemberRequest;
use App\Models\Project;
use App\Models\User;
use App\Notifications\ProjectMemberAddedNotification;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;

class ProjectMemberController extends Controller
{
    public function store(
        ProjectMemberRequest $request,
        Project $project,
        ActivityLogger $activity,
    ): RedirectResponse {
        $user = User::findOrFail($request->integer('user_id'));
        $exists = $project->members()->whereKey($user->id)->exists();

        $project->members()->syncWithoutDetaching([
            $user->id => ['role' => $request->string('role')->value()],
        ]);

        $activity->record($request->user(), $project, $project, $exists ? 'member.updated' : 'member.added', [
            'user_id' => $user->id,
            'description' => $exists
                ? "{$request->user()->name} mengubah peran proyek {$user->name}."
                : "{$request->user()->name} menambahkan {$user->name} ke proyek.",
        ]);

        if (! $exists && $user->id !== $request->user()->id) {
            $user->notify(new ProjectMemberAddedNotification($project, $request->user()));
        }

        return back()->with('success', $exists ? 'Peran anggota berhasil diperbarui.' : 'Anggota berhasil ditambahkan.');
    }

    public function destroy(
        Project $project,
        User $user,
        ActivityLogger $activity,
    ): RedirectResponse {
        $this->authorize('manageMembers', $project);
        abort_unless($project->members()->whereKey($user->id)->exists(), 404);
        abort_if($project->owner_id === $user->id, 422, 'Pindahkan kepemilikan proyek sebelum menghapus pemilik.');

        $project->members()->detach($user->id);
        $activity->record(request()->user(), $project, $project, 'member.removed', [
            'user_id' => $user->id,
            'description' => request()->user()->name." menghapus {$user->name} dari proyek.",
        ]);

        return back()->with('success', 'Anggota berhasil dihapus.');
    }
}
