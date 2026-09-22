<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ActivityLogger
{
    /** @param array<string, mixed> $metadata */
    public function record(
        ?User $actor,
        Project $project,
        Model $subject,
        string $event,
        array $metadata = [],
    ): ActivityLog {
        return ActivityLog::create([
            'actor_id' => $actor?->id,
            'project_id' => $project->id,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'event' => $event,
            'metadata' => $metadata,
        ]);
    }
}
