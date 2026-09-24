<?php

namespace App\Policies;

use App\Enums\ProjectMemberRole;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, Project $project): bool
    {
        return $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->is_active && $user->isAdmin();
    }

    public function update(User $user, Project $project): bool
    {
        return $this->hasRole($user, $project, [
            ProjectMemberRole::Owner,
            ProjectMemberRole::Manager,
        ]);
    }

    public function archive(User $user, Project $project): bool
    {
        return $this->hasRole($user, $project, [ProjectMemberRole::Owner]);
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->is_active && $user->isAdmin();
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $this->hasRole($user, $project, [
            ProjectMemberRole::Owner,
            ProjectMemberRole::Manager,
        ]);
    }

    public function manageWorkflow(User $user, Project $project): bool
    {
        return $this->update($user, $project);
    }

    /** @param list<ProjectMemberRole> $roles */
    private function hasRole(User $user, Project $project, array $roles): bool
    {
        if (! $user->is_active) {
            return false;
        }

        $role = $user->projectRole($project);

        return $role !== null && in_array($role, $roles, true);
    }
}
