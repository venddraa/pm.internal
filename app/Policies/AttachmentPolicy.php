<?php

namespace App\Policies;

use App\Enums\ProjectMemberRole;
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
        return $user->is_active && in_array($user->projectRole($task->project), [
            ProjectMemberRole::Owner,
            ProjectMemberRole::Manager,
            ProjectMemberRole::Member,
        ], true);
    }

    public function delete(User $user, Attachment $attachment): bool
    {
        return $attachment->uploaded_by === $user->id
            || $user->can('update', $attachment->task->project);
    }
}
