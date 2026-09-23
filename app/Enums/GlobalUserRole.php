<?php

namespace App\Enums;

enum GlobalUserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin',
            self::Manager => 'Manajer',
            self::Member => 'Anggota',
        };
    }
}
