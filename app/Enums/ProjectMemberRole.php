<?php

namespace App\Enums;

enum ProjectMemberRole: string
{
    case Owner = 'owner';
    case Manager = 'manager';
    case Member = 'member';
    case Viewer = 'viewer';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Pemilik',
            self::Manager => 'Manajer',
            self::Member => 'Anggota',
            self::Viewer => 'Peninjau',
        };
    }
}
