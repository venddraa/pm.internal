<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $actor_id
 * @property int $project_id
 * @property class-string<Model>|string $subject_type
 * @property int $subject_id
 * @property string $event
 * @property array<string, mixed> $metadata
 * @property Carbon $created_at
 * @property-read User|null $actor
 * @property-read Project $project
 */
class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['actor_id', 'project_id', 'subject_type', 'subject_id', 'event', 'metadata'];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
