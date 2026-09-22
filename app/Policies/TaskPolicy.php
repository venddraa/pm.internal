<?php

namespace App\Policies;

use App\Enums\ProjectMemberRole;
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
        return $this->canWrite($user, $project);
    }

    public function update(User $user, Task $task): bool
    {
        return $this->canWrite($user, $task->project);
    }

    public function move(User $user, Task $task): bool
    {
        return $this->update($user, $task);
    }

    public function archive(User $user, Task $task): bool
    {
        $role = $user->projectRole($task->project);

        return in_array($role, [ProjectMemberRole::Owner, ProjectMemberRole::Manager], true);
    }

    private function canWrite(User $user, Project $project): bool
    {
        $role = $user->projectRole($project);

        return $user->is_active && in_array($role, [
            ProjectMemberRole::Owner,
            ProjectMemberRole::Manager,
            ProjectMemberRole::Member,
        ], true);
    }
}
