<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Planning = 'planning';
    case Active = 'active';
    case OnHold = 'on_hold';
    case Completed = 'completed';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Planning => 'Belum Dimulai',
            self::Active => 'Dikerjakan',
            self::OnHold => 'Ditunda',
            self::Completed => 'Selesai',
            self::Archived => 'Diarsipkan',
        };
    }
}
