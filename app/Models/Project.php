<?php

namespace App\Models;

use App\Enums\ProjectHealth;
use App\Enums\ProjectMemberRole;
use App\Enums\ProjectStatus;
use App\Enums\StatusCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $key
 * @property string|null $description
 * @property int $owner_id
 * @property ProjectStatus $status
 * @property ProjectHealth $health
 * @property Carbon|null $start_date
 * @property Carbon|null $due_date
 * @property int $created_by
 * @property int $next_task_number
 * @property Carbon|null $archived_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $owner
 * @property-read User $creator
 * @property-read Collection<int, User> $members
 * @property-read Collection<int, ProjectStatusRecord> $statuses
 * @property-read Collection<int, Task> $tasks
 * @property-read Collection<int, Label> $labels
 * @property-read Collection<int, ActivityLog> $activityLogs
 */
class Project extends Model
{
    protected $fillable = [
        'name',
        'key',
        'description',
        'owner_id',
        'status',
        'health',
        'start_date',
        'due_date',
        'created_by',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'health' => ProjectHealth::class,
            'start_date' => 'date',
            'due_date' => 'date',
            'archived_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'key';
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return BelongsToMany<User, $this> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return HasMany<ProjectStatusRecord, $this> */
    public function statuses(): HasMany
    {
        return $this->hasMany(ProjectStatusRecord::class)->orderBy('position');
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /** @return HasMany<Label, $this> */
    public function labels(): HasMany
    {
        return $this->hasMany(Label::class)->orderBy('name');
    }

    /** @return HasMany<ActivityLog, $this> */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class)->latest('created_at');
    }

    /** @param Builder<Project> $query
     * @return Builder<Project>
     */
    public function scopeAccessibleTo(Builder $query, User $user): Builder
    {
        return $query;
    }

    /** @param Builder<Project> $query
     * @return Builder<Project>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    /** @param Builder<Project> $query
     * @return Builder<Project>
     */
    public function scopeWithProgressCounts(Builder $query): Builder
    {
        return $query->withCount([
            'tasks as total_tasks_count' => fn (Builder $tasks) => $tasks->whereNull('archived_at'),
            'tasks as completed_tasks_count' => fn (Builder $tasks) => $tasks
                ->whereNull('archived_at')
                ->whereHas('status', fn (Builder $statuses) => $statuses->where('category', StatusCategory::Done->value)),
        ]);
    }

    public function memberRole(User $user): ?ProjectMemberRole
    {
        return $user->projectRole($this);
    }

    /** @return array{total: int, completed: int, open: int, percent: int} */
    public function progressStats(): array
    {
        $base = $this->tasks()->whereNull('archived_at');
        $total = (clone $base)->count();
        $completed = (clone $base)
            ->whereHas('status', fn (Builder $query) => $query->where('category', StatusCategory::Done->value))
            ->count();

        return [
            'total' => $total,
            'completed' => $completed,
            'open' => $total - $completed,
            'percent' => $total === 0 ? 0 : (int) round(($completed / $total) * 100),
        ];
    }
}
