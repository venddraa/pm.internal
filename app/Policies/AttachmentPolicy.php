<?php

namespace App\Policies;

use App\Models\Attachment;
use App\Models\Task;
use App\Models\User;

class AttachmentPolicy
{
    public function view(User $user, Attachment $attachment): bool
    {
        return $user->can('view', $attachment->task);
    }

    public function create(User $user, Task $task): bool
    {
        return $user->can('update', $task);
    }

    public function delete(User $user, Attachment $attachment): bool
    {
        return $attachment->uploaded_by === $user->id
            || $user->can('update', $attachment->task->project);
    }
}
