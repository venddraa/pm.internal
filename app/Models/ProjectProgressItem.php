<?php

namespace App\Models;

use App\Enums\StatusCategory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_id
 * @property string $name
 * @property int|null $assignee_id
 * @property int $target_value
 * @property int $completed_value
 * @property StatusCategory $status
 * @property Carbon|null $due_date
 * @property string|null $notes
 * @property int $position
 * @property-read Project $project
 * @property-read User|null $assignee
 */
class ProjectProgressItem extends Model
{
    protected $fillable = [
        'project_id',
        'name',
        'assignee_id',
        'target_value',
        'completed_value',
        'status',
        'due_date',
        'notes',
        'position',
    ];

    protected function casts(): array
    {
        return [
            'status' => StatusCategory::class,
            'due_date' => 'date',
        ];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}
