<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table): void {
            $table->string('progress_mode', 24)->default('checklist')->after('health');
            $table->unsignedInteger('target_value')->nullable()->after('progress_mode');
            $table->string('progress_unit', 40)->nullable()->after('target_value');
            $table->text('blockers')->nullable()->after('due_date');
            $table->text('next_steps')->nullable()->after('blockers');
            $table->timestamp('last_progress_update_at')->nullable()->after('next_steps');
        });

        Schema::create('project_progress_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name', 160);
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('target_value');
            $table->unsignedInteger('completed_value')->default(0);
            $table->string('status', 24)->default('todo')->index();
            $table->date('due_date')->nullable()->index();
            $table->text('notes')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['project_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_progress_items');

        Schema::table('projects', function (Blueprint $table): void {
            $table->dropColumn([
                'progress_mode',
                'target_value',
                'progress_unit',
                'blockers',
                'next_steps',
                'last_progress_update_at',
            ]);
        });
    }
};
