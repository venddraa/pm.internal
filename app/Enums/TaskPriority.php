<?php

namespace App\Enums;

enum TaskPriority: string
{
    case Urgent = 'urgent';
    case High = 'high';
    case Normal = 'normal';
    case Low = 'low';
    case None = 'none';

    public function label(): string
    {
        return match ($this) {
            self::Urgent => 'Mendesak',
            self::High => 'Tinggi',
            self::Normal => 'Normal',
            self::Low => 'Rendah',
            self::None => 'Tanpa prioritas',
        };
    }

    public function weight(): int
    {
        return match ($this) {
            self::Urgent => 1,
            self::High => 2,
            self::Normal => 3,
            self::Low => 4,
            self::None => 5,
        };
    }
}
