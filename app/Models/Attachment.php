<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $task_id
 * @property int $uploaded_by
 * @property string $original_name
 * @property string $storage_path
 * @property string $mime_type
 * @property int $file_size
 * @property Carbon|null $created_at
 * @property-read Task $task
 * @property-read User $uploader
 */
class Attachment extends Model
{
    protected $fillable = [
        'task_id',
        'uploaded_by',
        'original_name',
        'storage_path',
        'mime_type',
        'file_size',
    ];

    /** @return BelongsTo<Task, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /** @return BelongsTo<User, $this> */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
