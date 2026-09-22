<?php

namespace App\Policies;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;

class CommentPolicy
{
    public function create(User $user, Task $task): bool
    {
        return $user->is_active && $user->can('view', $task);
    }

    public function update(User $user, Comment $comment): bool
    {
        return $user->is_active
            && $comment->author_id === $user->id
            && $user->can('view', $comment->task);
    }

    public function delete(User $user, Comment $comment): bool
    {
        return $this->update($user, $comment);
    }
}
