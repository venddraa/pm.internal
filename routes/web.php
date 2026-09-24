<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AgendaTaskController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectSettingsController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskMoveController;
use App\Http\Controllers\UserAvatarController;
use App\Http\Controllers\WorkflowStatusController;
use App\Models\Project;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => auth()->check()
    ? redirect()->route('home')
    : redirect()->route('login'));

Route::middleware('auth')->group(function () {
    Route::get('home', HomeController::class)->name('home');
    Route::post('agenda/tasks', [AgendaTaskController::class, 'store'])->name('agenda.tasks.store');
    Route::patch('agenda/tasks/{task:id}', [AgendaTaskController::class, 'update'])->name('agenda.tasks.update');
    Route::redirect('dashboard', '/home')->name('dashboard');
    Route::get('my-tasks', MyTasksController::class)->name('my-tasks');
    Route::get('search', SearchController::class)->name('search');
    Route::get('avatars/{user}', UserAvatarController::class)->name('profile.avatar');

    Route::get('inbox', [InboxController::class, 'index'])->name('inbox.index');
    Route::patch('inbox/read-all', [InboxController::class, 'readAll'])->name('inbox.read-all');
    Route::patch('inbox/{notification}/read', [InboxController::class, 'read'])->name('inbox.read');

    Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');

    Route::scopeBindings()->prefix('projects/{project}')->group(function () {
        Route::get('/', fn (Project $project) => to_route('projects.list', $project));
        Route::get('overview', [ProjectController::class, 'overview'])->name('projects.overview');
        Route::get('list', [ProjectController::class, 'list'])->name('projects.list');
        Route::get('board', [ProjectController::class, 'board'])->name('projects.board');
        Route::get('activity', [ProjectController::class, 'activity'])->name('projects.activity');
        Route::get('settings', ProjectSettingsController::class)->name('projects.settings');
        Route::patch('/', [ProjectController::class, 'update'])->name('projects.update');
        Route::delete('/', [ProjectController::class, 'archive'])->name('projects.archive');
        Route::delete('permanent', [ProjectController::class, 'destroy'])->name('projects.destroy');

        Route::post('tasks', [TaskController::class, 'store'])->name('tasks.store');
        Route::patch('tasks/{task:task_number}', [TaskController::class, 'update'])->name('tasks.update');
        Route::delete('tasks/{task:task_number}', [TaskController::class, 'archive'])->name('tasks.archive');
        Route::patch('tasks/{task:task_number}/move', TaskMoveController::class)->name('tasks.move');

        Route::post('tasks/{task:task_number}/comments', [CommentController::class, 'store'])->name('comments.store');
        Route::patch('tasks/{task:task_number}/comments/{comment}', [CommentController::class, 'update'])->name('comments.update');
        Route::delete('tasks/{task:task_number}/comments/{comment}', [CommentController::class, 'destroy'])->name('comments.destroy');

        Route::post('tasks/{task:task_number}/attachments', [AttachmentController::class, 'store'])->name('attachments.store');
        Route::get('tasks/{task:task_number}/attachments/{attachment}', [AttachmentController::class, 'download'])->name('attachments.download');
        Route::delete('tasks/{task:task_number}/attachments/{attachment}', [AttachmentController::class, 'destroy'])->name('attachments.destroy');

        Route::post('members', [ProjectMemberController::class, 'store'])->name('project-members.store');
        Route::delete('members/{user}', [ProjectMemberController::class, 'destroy'])
            ->withoutScopedBindings()
            ->name('project-members.destroy');

        Route::post('workflow/statuses', [WorkflowStatusController::class, 'store'])->name('workflow-statuses.store');
        Route::patch('workflow/statuses/reorder', [WorkflowStatusController::class, 'reorder'])->name('workflow-statuses.reorder');
        Route::patch('workflow/statuses/{status}', [WorkflowStatusController::class, 'update'])->name('workflow-statuses.update');
        Route::delete('workflow/statuses/{status}', [WorkflowStatusController::class, 'destroy'])->name('workflow-statuses.destroy');

        Route::post('labels', [LabelController::class, 'store'])->name('labels.store');
        Route::patch('labels/{label}', [LabelController::class, 'update'])->name('labels.update');
        Route::delete('labels/{label}', [LabelController::class, 'destroy'])->name('labels.destroy');
    });

    Route::prefix('administration')->name('admin.')->group(function () {
        Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('users', [AdminUserController::class, 'store'])->name('users.store');
        Route::patch('users/{user}', [AdminUserController::class, 'update'])->name('users.update');
        Route::delete('users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');
    });
});

require __DIR__.'/settings.php';
