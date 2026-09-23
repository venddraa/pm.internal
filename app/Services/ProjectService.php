<?php

namespace App\Services;

use App\Enums\ProjectHealth;
use App\Enums\ProjectMemberRole;
use App\Enums\ProjectStatus;
use App\Enums\StatusCategory;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ProjectService
{
    private const DEFAULT_STATUSES = [
        ['name' => 'BACKLOG', 'color' => '#94a3b8', 'category' => StatusCategory::Todo, 'position' => 0],
        ['name' => 'TO DO', 'color' => '#64748b', 'category' => StatusCategory::Todo, 'position' => 1],
        ['name' => 'IN PROGRESS', 'color' => '#2563eb', 'category' => StatusCategory::InProgress, 'position' => 2],
        ['name' => 'REVIEW', 'color' => '#d97706', 'category' => StatusCategory::InProgress, 'position' => 3],
        ['name' => 'DONE', 'color' => '#16a34a', 'category' => StatusCategory::Done, 'position' => 4],
    ];

    public function __construct(private readonly ActivityLogger $activity) {}

    /** @param array<string, mixed> $data */
    public function create(array $data, User $actor): Project
    {
        return DB::transaction(function () use ($data, $actor): Project {
            $project = Project::create([
                ...$data,
                'key' => strtoupper($data['key']),
                'owner_id' => $data['owner_id'],
                'created_by' => $actor->id,
                'status' => ProjectStatus::Planning,
                'health' => ProjectHealth::OnTrack,
                'progress_mode' => $data['progress_mode'] ?? 'checklist',
                'target_value' => $data['target_value'] ?? null,
                'progress_unit' => $data['progress_unit'] ?? null,
            ]);

            $project->members()->attach($data['owner_id'], [
                'role' => ProjectMemberRole::Owner->value,
            ]);

            foreach (self::DEFAULT_STATUSES as $status) {
                $project->statuses()->create([
                    ...$status,
                    'category' => $status['category']->value,
                ]);
            }

            $this->activity->record($actor, $project, $project, 'project.created', [
                'description' => "{$actor->name} membuat pekerjaan {$project->name}.",
            ]);

            return $project->load(['owner', 'members', 'statuses']);
        });
    }
}
