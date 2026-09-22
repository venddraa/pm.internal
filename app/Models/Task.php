<?php

namespace App\Models;

use App\Enums\TaskPriority;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_id
 * @property int $task_number
 * @property string $title
 * @property string|null $description
 * @property int $status_id
 * @property TaskPriority $priority
 * @property int $created_by
 * @property Carbon|null $start_date
 * @property Carbon|null $due_date
 * @property int $position
 * @property Carbon|null $completed_at
 * @property Carbon|null $archived_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string $reference
 * @property-read Project $project
 * @property-read ProjectStatusRecord $status
 * @property-read User $creator
 * @property-read Collection<int, User> $assignees
 * @property-read Collection<int, Label> $labels
 * @property-read Collection<int, Comment> $comments
 * @property-read Collection<int, Attachment> $attachments
 */
class Task extends Model
{
    protected $fillable = [
        'project_id',
        'task_number',
        'title',
        'description',
        'status_id',
        'priority',
        'created_by',
        'start_date',
        'due_date',
        'position',
        'completed_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'priority' => TaskPriority::class,
            'start_date' => 'date',
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'task_number';
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<ProjectStatusRecord, $this> */
    public function status(): BelongsTo
    {
        return $this->belongsTo(ProjectStatusRecord::class, 'status_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return BelongsToMany<User, $this> */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    /** @return BelongsToMany<Label, $this> */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class);
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    /** @return HasMany<Attachment, $this> */
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class)->latest();
    }

    /** @param Builder<Task> $query
     * @return Builder<Task>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    /** @param Builder<Task> $query
     * @return Builder<Task>
     */
    public function scopeAssignedTo(Builder $query, User $user): Builder
    {
        return $query->active()
            ->whereHas('assignees', fn (Builder $assignees) => $assignees->whereKey($user->id))
            ->whereHas('project', fn (Builder $projects) => $projects->accessibleTo($user)->active());
    }

    public function getReferenceAttribute(): string
    {
        $key = $this->relationLoaded('project') ? $this->project->key : $this->project()->value('key');

        return $key.'-'.$this->task_number;
    }
}
