<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_deletions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('project_id');
            $table->string('project_key', 12);
            $table->string('project_name');
            $table->text('reason');
            $table->jsonb('summary')->default('{}');
            $table->timestamp('deleted_at');

            $table->index(['project_key', 'deleted_at']);
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_deletions');
    }
};
