<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $actor_id
 * @property int $project_id
 * @property string $project_key
 * @property string $project_name
 * @property string $reason
 * @property array<string, int> $summary
 * @property Carbon $deleted_at
 * @property-read User|null $actor
 */
class ProjectDeletion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'actor_id',
        'project_id',
        'project_key',
        'project_name',
        'reason',
        'summary',
        'deleted_at',
    ];

    protected function casts(): array
    {
        return [
            'summary' => 'array',
            'deleted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
