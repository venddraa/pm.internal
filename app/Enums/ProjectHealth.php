<?php

namespace App\Enums;

enum ProjectHealth: string
{
    case OnTrack = 'on_track';
    case AtRisk = 'at_risk';
    case OffTrack = 'off_track';

    public function label(): string
    {
        return match ($this) {
            self::OnTrack => 'Sesuai Rencana',
            self::AtRisk => 'Berisiko',
            self::OffTrack => 'Terkendala',
        };
    }
}
