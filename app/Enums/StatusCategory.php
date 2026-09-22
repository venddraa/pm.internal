<?php

namespace App\Enums;

enum StatusCategory: string
{
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case Done = 'done';

    public function label(): string
    {
        return match ($this) {
            self::Todo => 'Belum Dikerjakan',
            self::InProgress => 'Sedang Dikerjakan',
            self::Done => 'Selesai',
        };
    }
}
