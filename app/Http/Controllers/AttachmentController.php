<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAttachmentRequest;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use App\Services\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function store(
        StoreAttachmentRequest $request,
        Project $project,
        Task $task,
        ActivityLogger $activity,
    ): RedirectResponse {
        $file = $request->file('file');
        $path = $file->storeAs(
            "attachments/{$project->id}/{$task->id}",
            Str::uuid()->toString().'.'.$file->extension(),
            config('filesystems.default'),
        );

        $attachment = $task->attachments()->create([
            'uploaded_by' => $request->user()->id,
            'original_name' => $file->getClientOriginalName(),
            'storage_path' => $path,
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'file_size' => $file->getSize(),
        ]);

        $activity->record($request->user(), $project, $task, 'attachment.uploaded', [
            'attachment_id' => $attachment->id,
            'name' => $attachment->original_name,
            'description' => "{$request->user()->name} melampirkan {$attachment->original_name}.",
        ]);

        return back()->with('success', 'Lampiran berhasil diunggah.');
    }

    public function download(Project $project, Task $task, Attachment $attachment): StreamedResponse
    {
        $this->authorize('view', $attachment);
        abort_unless(Storage::exists($attachment->storage_path), 404);

        return Storage::download($attachment->storage_path, $attachment->original_name, [
            'Content-Type' => $attachment->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function destroy(Project $project, Task $task, Attachment $attachment): RedirectResponse
    {
        $this->authorize('delete', $attachment);
        Storage::delete($attachment->storage_path);
        $attachment->delete();

        return back()->with('success', 'Lampiran berhasil dihapus.');
    }
}
