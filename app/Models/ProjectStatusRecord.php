<?php

namespace App\Models;

use App\Enums\StatusCategory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $project_id
 * @property string $name
 * @property string $color
 * @property StatusCategory $category
 * @property int $position
 * @property int|null $tasks_count
 * @property-read Project $project
 * @property-read Collection<int, Task> $tasks
 */
class ProjectStatusRecord extends Model
{
    protected $table = 'project_statuses';

    protected $fillable = ['project_id', 'name', 'color', 'category', 'position'];

    protected function casts(): array
    {
        return ['category' => StatusCategory::class];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'status_id');
    }
}
