<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $user->can('view', $task->project);
    }

    public function create(User $user, Project $project): bool
    {
        return $user->is_active && $project->archived_at === null;
    }

    public function update(User $user, Task $task): bool
    {
        return $user->is_active && (
            $user->isAdmin()
            || $task->created_by === $user->id
            || $task->assignees()->whereKey($user->id)->exists()
        );
    }

    public function move(User $user, Task $task): bool
    {
        return $this->update($user, $task);
    }

    public function archive(User $user, Task $task): bool
    {
        return $user->is_active && ($user->isAdmin() || $task->created_by === $user->id);
    }
}
