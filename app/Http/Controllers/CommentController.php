<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommentRequest;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;

class CommentController extends Controller
{
    public function store(
        CommentRequest $request,
        Project $project,
        Task $task,
        ActivityLogger $activity,
    ): RedirectResponse {
        $comment = $task->comments()->create([
            'author_id' => $request->user()->id,
            'content' => $request->string('content')->trim()->value(),
        ]);
        $activity->record($request->user(), $project, $task, 'comment.created', [
            'comment_id' => $comment->id,
            'description' => "{$request->user()->name} mengomentari {$task->reference}.",
        ]);

        return back()->with('success', 'Komentar berhasil ditambahkan.');
    }

    public function update(CommentRequest $request, Project $project, Task $task, Comment $comment): RedirectResponse
    {
        $comment->update([
            'content' => $request->string('content')->trim()->value(),
            'edited_at' => now(),
        ]);

        return back()->with('success', 'Komentar berhasil diperbarui.');
    }

    public function destroy(Project $project, Task $task, Comment $comment): RedirectResponse
    {
        $this->authorize('delete', $comment);
        $comment->delete();

        return back()->with('success', 'Komentar berhasil dihapus.');
    }
}
