<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->timestamp('scheduled_at')->nullable()->after('due_date')->index();
            $table->text('status_note')->nullable()->after('scheduled_at');
            $table->text('result_notes')->nullable()->after('status_note');
            $table->text('next_action')->nullable()->after('result_notes');
            $table->string('reference_url', 2048)->nullable()->after('next_action');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropIndex(['scheduled_at']);
            $table->dropColumn([
                'scheduled_at',
                'status_note',
                'result_notes',
                'next_action',
                'reference_url',
            ]);
        });
    }
};
