<?php

namespace App\Support;

use App\Enums\StatusCategory;
use App\Models\Project;
use App\Models\ProjectStatusRecord;
use Illuminate\Support\Str;

final class AgendaStatus
{
    public const OPTIONS = [
        ['value' => 'todo', 'label' => 'Belum mulai', 'color' => '#64748b'],
        ['value' => 'progress', 'label' => 'Proses', 'color' => '#2563eb'],
        ['value' => 'waiting', 'label' => 'Menunggu', 'color' => '#d97706'],
        ['value' => 'done', 'label' => 'Selesai', 'color' => '#16a34a'],
    ];

    public static function key(ProjectStatusRecord $status): string
    {
        if ($status->category === StatusCategory::Done) {
            return 'done';
        }

        if ($status->category === StatusCategory::Todo) {
            return 'todo';
        }

        $name = Str::lower($status->name);

        return Str::contains($name, ['menunggu', 'waiting', 'blocked', 'tertahan'])
            ? 'waiting'
            : 'progress';
    }

    public static function label(ProjectStatusRecord $status): string
    {
        return collect(self::OPTIONS)->firstWhere('value', self::key($status))['label'];
    }

    public static function color(ProjectStatusRecord $status): string
    {
        return collect(self::OPTIONS)->firstWhere('value', self::key($status))['color'];
    }

    public static function resolve(Project $project, string $key): ProjectStatusRecord
    {
        $statuses = $project->statuses()->orderBy('position')->get();

        $status = $statuses->first(fn (ProjectStatusRecord $status): bool => self::key($status) === $key);
        if ($status) {
            return $status;
        }

        if ($key === 'waiting') {
            return $project->statuses()->create([
                'name' => 'MENUNGGU',
                'color' => '#d97706',
                'category' => StatusCategory::InProgress->value,
                'position' => ((int) $statuses->max('position')) + 1,
            ]);
        }

        $category = match ($key) {
            'todo' => StatusCategory::Todo,
            'done' => StatusCategory::Done,
            default => StatusCategory::InProgress,
        };

        return $project->statuses()->create([
            'name' => match ($key) {
                'todo' => 'BELUM MULAI',
                'done' => 'SELESAI',
                default => 'PROSES',
            },
            'color' => collect(self::OPTIONS)->firstWhere('value', $key)['color'] ?? '#64748b',
            'category' => $category->value,
            'position' => ((int) $statuses->max('position')) + 1,
        ]);
    }
}
