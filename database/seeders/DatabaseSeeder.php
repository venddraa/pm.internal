<?php

namespace Database\Seeders;

use App\Enums\GlobalUserRole;
use App\Enums\ProjectHealth;
use App\Enums\ProjectMemberRole;
use App\Enums\ProjectStatus;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ProjectMemberAddedNotification;
use App\Services\ActivityLogger;
use App\Services\ProjectService;
use App\Services\TaskService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function __construct(
        private readonly ProjectService $projects,
        private readonly TaskService $tasks,
        private readonly ActivityLogger $activity,
    ) {}

    public function run(): void
    {
        DB::transaction(function (): void {
            $users = $this->createUsers();

            $this->seedProject(
                creator: $users['admin'],
                attributes: [
                    'name' => 'Internal Reporting Portal',
                    'key' => 'IRP',
                    'description' => 'Central portal for operational and management reporting across the department.',
                    'owner_id' => $users['vendra']->id,
                    'status' => ProjectStatus::Active,
                    'health' => ProjectHealth::AtRisk,
                    'start_date' => now()->subMonths(2)->toDateString(),
                    'due_date' => now()->addWeeks(3)->toDateString(),
                ],
                members: [
                    [$users['raina'], ProjectMemberRole::Manager],
                    [$users['azmi'], ProjectMemberRole::Member],
                    [$users['zia'], ProjectMemberRole::Member],
                    [$users['nanda'], ProjectMemberRole::Viewer],
                ],
                labels: [
                    ['Backend', '#2563eb'], ['Frontend', '#0f766e'], ['Bug', '#dc2626'],
                    ['UI/UX', '#7c3aed'], ['Documentation', '#64748b'], ['Deployment', '#b45309'],
                ],
                taskData: [
                    ['Prepare database schema', 'DONE', 'normal', -35, ['vendra'], ['Backend']],
                    ['Implement session authentication', 'DONE', 'high', -28, ['azmi'], ['Backend']],
                    ['Design project overview page', 'DONE', 'normal', -18, ['raina', 'zia'], ['Frontend', 'UI/UX']],
                    ['Review project permission matrix', 'DONE', 'high', -12, ['vendra', 'nanda'], ['Documentation']],
                    ['Create operational reporting endpoint', 'IN PROGRESS', 'urgent', -2, ['azmi'], ['Backend']],
                    ['Design dashboard filters', 'REVIEW', 'high', 0, ['raina', 'zia'], ['Frontend', 'UI/UX']],
                    ['Fix notification unread counter', 'IN PROGRESS', 'urgent', -1, ['zia'], ['Bug', 'Frontend']],
                    ['Validate monthly operational report', 'TO DO', 'normal', 1, ['raina', 'nanda'], ['Documentation']],
                    ['Prepare staging deployment', 'REVIEW', 'high', 3, ['vendra', 'azmi'], ['Deployment']],
                    ['Conduct user acceptance testing', 'BACKLOG', 'normal', 8, ['nanda'], ['Documentation']],
                    ['Prepare production release', 'BACKLOG', 'high', 14, ['vendra'], ['Deployment']],
                    ['Document report data ownership', 'TO DO', 'low', null, ['nanda'], ['Documentation']],
                ],
            );

            $this->seedProject(
                creator: $users['admin'],
                attributes: [
                    'name' => 'Operation Monitoring Dashboard',
                    'key' => 'OMD',
                    'description' => 'Near real-time view of operational indicators and follow-up actions.',
                    'owner_id' => $users['raina']->id,
                    'status' => ProjectStatus::Active,
                    'health' => ProjectHealth::OnTrack,
                    'start_date' => now()->subMonth()->toDateString(),
                    'due_date' => now()->addMonths(2)->toDateString(),
                ],
                members: [
                    [$users['vendra'], ProjectMemberRole::Manager],
                    [$users['dwi'], ProjectMemberRole::Member],
                    [$users['maya'], ProjectMemberRole::Member],
                ],
                labels: [
                    ['Data', '#0369a1'], ['Frontend', '#0f766e'], ['API', '#1d4ed8'],
                    ['Enhancement', '#6d28d9'], ['Deployment', '#b45309'], ['Documentation', '#64748b'],
                ],
                taskData: [
                    ['Review dashboard requirements', 'DONE', 'normal', -16, ['raina', 'dwi'], ['Documentation']],
                    ['Map operation indicator sources', 'DONE', 'high', -10, ['dwi'], ['Data']],
                    ['Build traffic summary API', 'IN PROGRESS', 'high', 2, ['dwi'], ['API']],
                    ['Implement indicator freshness checks', 'IN PROGRESS', 'urgent', 1, ['maya'], ['Data', 'API']],
                    ['Create dashboard shell', 'REVIEW', 'normal', 4, ['vendra'], ['Frontend']],
                    ['Add regional filter controls', 'TO DO', 'normal', 7, ['vendra'], ['Frontend', 'Enhancement']],
                    ['Verify data reconciliation', 'BACKLOG', 'high', 12, ['raina', 'maya'], ['Data']],
                    ['Prepare monitoring runbook', 'BACKLOG', 'low', null, ['maya'], ['Deployment']],
                ],
            );

            $this->seedProject(
                creator: $users['admin'],
                attributes: [
                    'name' => 'Digital Document Management',
                    'key' => 'DDM',
                    'description' => 'Controlled storage, review, and retrieval of internal department documents.',
                    'owner_id' => $users['azmi']->id,
                    'status' => ProjectStatus::Planning,
                    'health' => ProjectHealth::OnTrack,
                    'start_date' => now()->addWeek()->toDateString(),
                    'due_date' => now()->addMonths(4)->toDateString(),
                ],
                members: [
                    [$users['zia'], ProjectMemberRole::Manager],
                    [$users['nanda'], ProjectMemberRole::Member],
                    [$users['dwi'], ProjectMemberRole::Viewer],
                ],
                labels: [
                    ['Discovery', '#475569'], ['Security', '#be123c'], ['Backend', '#2563eb'],
                    ['UI/UX', '#7c3aed'], ['Documentation', '#64748b'],
                ],
                taskData: [
                    ['Inventory department document types', 'IN PROGRESS', 'normal', 5, ['nanda'], ['Discovery']],
                    ['Define document retention rules', 'TO DO', 'high', 9, ['azmi', 'nanda'], ['Security', 'Documentation']],
                    ['Design folder and metadata model', 'TO DO', 'normal', 12, ['zia'], ['Backend']],
                    ['Review access control requirements', 'BACKLOG', 'urgent', 15, ['azmi', 'dwi'], ['Security']],
                    ['Prototype document search flow', 'BACKLOG', 'normal', 21, ['zia'], ['UI/UX']],
                    ['Draft migration checklist', 'BACKLOG', 'low', null, ['nanda'], ['Documentation']],
                ],
            );

            $this->seedProject(
                creator: $users['admin'],
                attributes: [
                    'name' => 'Infrastructure Performance Dashboard',
                    'key' => 'IPD',
                    'description' => 'Performance monitoring for internal infrastructure services and incident trends.',
                    'owner_id' => $users['dwi']->id,
                    'status' => ProjectStatus::OnHold,
                    'health' => ProjectHealth::OffTrack,
                    'start_date' => now()->subMonths(3)->toDateString(),
                    'due_date' => now()->subWeek()->toDateString(),
                ],
                members: [
                    [$users['vendra'], ProjectMemberRole::Manager],
                    [$users['maya'], ProjectMemberRole::Member],
                    [$users['raina'], ProjectMemberRole::Viewer],
                ],
                labels: [
                    ['Infrastructure', '#334155'], ['Data', '#0369a1'], ['Bug', '#dc2626'],
                    ['Deployment', '#b45309'], ['Documentation', '#64748b'],
                ],
                taskData: [
                    ['Confirm infrastructure data access', 'DONE', 'high', -26, ['dwi'], ['Infrastructure']],
                    ['Normalize service availability metrics', 'IN PROGRESS', 'urgent', -9, ['maya'], ['Data']],
                    ['Resolve collector timeout issue', 'IN PROGRESS', 'urgent', -6, ['vendra'], ['Bug']],
                    ['Review dashboard deployment topology', 'TO DO', 'high', -4, ['dwi', 'vendra'], ['Deployment']],
                    ['Rebaseline delivery milestones', 'BACKLOG', 'normal', 4, ['dwi', 'raina'], ['Documentation']],
                ],
            );
        });
    }

    /** @return array<string, User> */
    private function createUsers(): array
    {
        $password = 'Monitor123!';

        return [
            'admin' => User::create(['name' => 'Joko Santoso', 'email' => 'admin@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Admin, 'is_active' => true, 'email_verified_at' => now()]),
            'vendra' => User::create(['name' => 'Vendra Hartono', 'email' => 'vendra@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => true, 'email_verified_at' => now()]),
            'raina' => User::create(['name' => 'Raina Putri', 'email' => 'raina@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => true, 'email_verified_at' => now()]),
            'azmi' => User::create(['name' => 'Azmi Fadillah', 'email' => 'azmi@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => true, 'email_verified_at' => now()]),
            'zia' => User::create(['name' => 'Zia Ramadhani', 'email' => 'zia@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => true, 'email_verified_at' => now()]),
            'nanda' => User::create(['name' => 'Nanda Pratama', 'email' => 'nanda@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => true, 'email_verified_at' => now()]),
            'dwi' => User::create(['name' => 'Dwi Kartika', 'email' => 'dwi@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => true, 'email_verified_at' => now()]),
            'maya' => User::create(['name' => 'Maya Lestari', 'email' => 'maya@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => true, 'email_verified_at' => now()]),
            'inactive' => User::create(['name' => 'Bima Nugraha', 'email' => 'bima@monitor.local', 'password' => $password, 'role' => GlobalUserRole::Member, 'is_active' => false, 'email_verified_at' => now()]),
        ];
    }

    /**
     * @param  array{name: string, key: string, description: string, owner_id: int, status: ProjectStatus, health: ProjectHealth, start_date: string, due_date: string}  $attributes
     * @param  array<int, array{0: User, 1: ProjectMemberRole}>  $members
     * @param  array<int, array{0: string, 1: string}>  $labels
     * @param  array<int, array{0: string, 1: string, 2: string, 3: int|null, 4: string[], 5: string[]}>  $taskData
     */
    private function seedProject(User $creator, array $attributes, array $members, array $labels, array $taskData): Project
    {
        $project = $this->projects->create([
            'name' => $attributes['name'],
            'key' => $attributes['key'],
            'description' => $attributes['description'],
            'owner_id' => $attributes['owner_id'],
            'start_date' => $attributes['start_date'],
            'due_date' => $attributes['due_date'],
        ], $creator);

        $project->update([
            'status' => $attributes['status'],
            'health' => $attributes['health'],
        ]);

        foreach ($members as [$user, $role]) {
            if (! $project->members()->whereKey($user->id)->exists()) {
                $project->members()->attach($user->id, ['role' => $role->value]);
                Notification::send($user, new ProjectMemberAddedNotification($project, $creator));
            }
        }

        foreach ($labels as [$name, $color]) {
            $project->labels()->create(compact('name', 'color'));
        }

        $project->load(['members', 'statuses', 'labels']);
        $usersByFirstName = $project->members->keyBy(fn (User $user) => strtolower(explode(' ', $user->name)[0]));
        $statusByName = $project->statuses->keyBy('name');
        $labelByName = $project->labels->keyBy('name');

        foreach ($taskData as $index => [$title, $statusName, $priority, $dueOffset, $assigneeKeys, $labelNames]) {
            $assignees = collect($assigneeKeys)->map(fn (string $key) => $usersByFirstName->get($key)?->id)->filter()->values()->all();
            $labelIds = collect($labelNames)->map(fn (string $name) => $labelByName->get($name)?->id)->filter()->values()->all();
            $task = $this->tasks->create($project, [
                'title' => $title,
                'description' => $this->descriptionFor($title),
                'status_id' => $statusByName->get($statusName)->id,
                'priority' => $priority,
                'start_date' => now()->subDays(max(1, 18 - $index))->toDateString(),
                'due_date' => $dueOffset === null ? null : now()->addDays($dueOffset)->toDateString(),
                'assignee_ids' => $assignees,
                'label_ids' => $labelIds,
            ], $creator);

            if ($statusName === 'DONE') {
                $this->activity->record($creator, $project, $task, 'task.completed', [
                    'description' => "{$creator->name} completed {$task->reference}.",
                ]);
            }

            if ($index === 1 || $index === 4) {
                $this->addDiscussion($task, $project->members->values()->all());
            }
        }

        return $project;
    }

    /** @param User[] $members */
    private function addDiscussion(Task $task, array $members): void
    {
        $first = $members[0];
        $second = $members[1] ?? $members[0];
        Comment::create([
            'task_id' => $task->id,
            'author_id' => $first->id,
            'content' => 'Initial review is complete. Please verify the acceptance criteria before the next status update.',
        ]);
        Comment::create([
            'task_id' => $task->id,
            'author_id' => $second->id,
            'content' => 'Noted. I will attach the validation result and update the due date if another review cycle is needed.',
        ]);
    }

    private function descriptionFor(string $title): string
    {
        return "Deliver {$title} with documented acceptance criteria, an internal review, and any operational notes required for handover.";
    }
}
