import { Head, router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { TaskBoard } from '@/components/board/task-board';
import { ProjectPage } from '@/components/projects/project-page';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet';
import { TaskToolbar } from '@/components/tasks/task-toolbar';
import type {
    Label,
    Option,
    Project,
    Task,
    TaskDetail,
    User,
    WorkflowStatus,
} from '@/types';

type Props = {
    project: Project;
    tasks: Task[];
    statuses: WorkflowStatus[];
    members: User[];
    labels: Label[];
    filters: Record<string, string | number | undefined>;
    selectedTask: TaskDetail | null;
    priorityOptions: Option[];
    boardTruncated: boolean;
    permissions: { createTask: boolean };
};

export default function ProjectBoard({
    project,
    tasks,
    statuses,
    members,
    labels,
    filters,
    selectedTask,
    priorityOptions,
    boardTruncated,
    permissions,
}: Props) {
    const openTask = (task: Task) => {
        const params = new URLSearchParams(window.location.search);
        params.set('task', String(task.task_number));
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
    return (
        <>
            <Head title={`${project.key} Papan`} />
            <ProjectPage
                project={project}
                actions={
                    permissions.createTask ? (
                        <CreateTaskDialog
                            project={project}
                            statuses={statuses}
                            members={members}
                            labels={labels}
                            priorityOptions={priorityOptions}
                        />
                    ) : undefined
                }
            >
                <div className="flex h-full min-h-0 flex-col overflow-hidden">
                    <TaskToolbar
                        filters={filters}
                        statuses={statuses}
                        members={members}
                        labels={labels}
                        priorityOptions={priorityOptions}
                    />
                    {boardTruncated && (
                        <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
                            <AlertTriangle className="size-3.5" />
                            Papan menampilkan 500 tugas pertama. Persempit
                            filter untuk melihat hasil yang lebih spesifik.
                        </div>
                    )}
                    <div className="min-h-0 flex-1">
                        <TaskBoard
                            project={project}
                            statuses={statuses}
                            initialTasks={tasks}
                            canEdit={permissions.createTask}
                            onOpenTask={openTask}
                        />
                    </div>
                </div>
            </ProjectPage>
            <TaskDetailSheet
                project={project}
                task={selectedTask}
                statuses={statuses}
                members={members}
                labels={labels}
                priorityOptions={priorityOptions}
            />
        </>
    );
}
