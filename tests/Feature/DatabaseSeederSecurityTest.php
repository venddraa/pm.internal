<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DatabaseSeederSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_sample_accounts_cannot_be_seeded_without_a_private_password(): void
    {
        config()->set('demo.seed_password', null);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Set DEMO_SEED_PASSWORD');

        Artisan::call('db:seed', ['--class' => DatabaseSeeder::class]);
    }
}
