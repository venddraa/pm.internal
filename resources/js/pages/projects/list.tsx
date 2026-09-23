import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ListTodo } from 'lucide-react';
import * as React from 'react';
import { Pagination } from '@/components/app/pagination';
import { ProjectPage } from '@/components/projects/project-page';
import { WorkProgressPanel } from '@/components/projects/work-progress-panel';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import { QuickTaskInput } from '@/components/tasks/quick-task-input';
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet';
import { TaskRow } from '@/components/tasks/task-row';
import { TaskToolbar } from '@/components/tasks/task-toolbar';
import { Button } from '@/components/ui/button';
import type {
    Label,
    Option,
    Paginated,
    Project,
    ProgressItem,
    Task,
    TaskDetail,
    User,
    WorkflowStatus,
} from '@/types';

type Props = {
    project: Project;
    tasks: Paginated<Task>;
    statuses: WorkflowStatus[];
    members: User[];
    labels: Label[];
    filters: Record<string, string | number | undefined>;
    selectedTask: TaskDetail | null;
    priorityOptions: Option[];
    progressItems: ProgressItem[];
    permissions: { createTask: boolean; updateProject: boolean };
};

export default function ProjectList({
    project,
    tasks,
    statuses,
    members,
    labels,
    filters,
    selectedTask,
    priorityOptions,
    progressItems,
    permissions,
}: Props) {
    const workflowGroups = [
        { key: 'todo', label: 'Belum mulai', color: '#64748b' },
        { key: 'in_progress', label: 'Dikerjakan', color: '#2563eb' },
        { key: 'done', label: 'Selesai', color: '#16a34a' },
    ] as const;

    const storageKey = `collapsed-statuses-${project.key}`;

    const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>(
        () => {
            try {
                const stored = sessionStorage.getItem(storageKey);
                return stored
                    ? (JSON.parse(stored) as Record<string, boolean>)
                    : {};
            } catch {
                return {};
            }
        },
    );

    const toggleStatus = (status: string) => {
        setCollapsed((prev) => {
            const next = { ...prev, [status]: !prev[status] };
            try {
                sessionStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
                // sessionStorage not available
            }
            return next;
        });
    };

    return (
        <>
            <Head title={project.name} />
            <ProjectPage
                project={project}
                canManage={permissions.updateProject}
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
                    <div className="sam-scrollbar min-h-0 flex-1 overflow-auto">
                        <WorkProgressPanel
                            project={project}
                            items={progressItems}
                            members={members}
                            canEdit={permissions.updateProject}
                        />
                        <div className="bg-card border-b px-5 py-4">
                            <h2 className="text-base font-semibold">
                                Yang harus dikerjakan
                            </h2>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Daftar tindakan tim. Ubah status atau centang
                                saat sudah selesai.
                            </p>
                        </div>
                        <TaskToolbar
                            filters={filters}
                            statuses={statuses}
                            members={members}
                            labels={labels}
                            priorityOptions={priorityOptions}
                        />
                        {tasks.total === 0 ? (
                            <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-12 text-center">
                                <ListTodo className="text-primary mb-4 size-9" />
                                <h2 className="text-xl font-semibold">
                                    {Object.values(filters).some(Boolean)
                                        ? 'Tidak ada tugas yang cocok'
                                        : 'Mulai pekerjaan pertama tim'}
                                </h2>
                                <p className="text-muted-foreground mt-3 text-sm leading-6">
                                    {Object.values(filters).some(Boolean)
                                        ? 'Sesuaikan filter atau tampilkan semua tugas dalam pekerjaan.'
                                        : 'Buat tugas lalu pilih penanggung jawab. Tugas akan muncul di Tugas Saya milik orang tersebut.'}
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center gap-3">
                                    {Object.values(filters).some(Boolean) && (
                                        <Button asChild variant="outline">
                                            <Link
                                                href={`/projects/${project.key}/list`}
                                            >
                                                Hapus filter
                                            </Link>
                                        </Button>
                                    )}
                                    {permissions.updateProject && (
                                        <Button asChild variant="outline">
                                            <Link
                                                href={`/projects/${project.key}/settings`}
                                            >
                                                Pengaturan pekerjaan
                                            </Link>
                                        </Button>
                                    )}
                                    {permissions.createTask && (
                                        <CreateTaskDialog
                                            project={project}
                                            statuses={statuses}
                                            members={members}
                                            labels={labels}
                                            priorityOptions={priorityOptions}
                                        />
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="min-w-[1000px]">
                                <div className="sam-task-grid bg-muted/90 text-muted-foreground sticky top-0 z-[2] h-11 items-center border-b text-xs font-medium backdrop-blur">
                                    <span className="px-4">Nama tugas</span>
                                    <span className="px-2">Status</span>
                                    <span className="px-2">
                                        Penanggung jawab
                                    </span>
                                    <span className="px-2">Tenggat</span>
                                    <span className="px-2">Prioritas</span>
                                    <span className="px-2 text-center">
                                        Komentar
                                    </span>
                                    <span />
                                </div>
                                {workflowGroups.map((group) => {
                                    const groupTasks = tasks.data.filter(
                                        (task) =>
                                            task.status.category === group.key,
                                    );
                                    const quickStatus =
                                        statuses.find(
                                            (status) =>
                                                status.category === group.key &&
                                                status.name !== 'BACKLOG' &&
                                                status.name !== 'REVIEW',
                                        ) ??
                                        statuses.find(
                                            (status) =>
                                                status.category === group.key,
                                        );
                                    const isCollapsed = !!collapsed[group.key];
                                    return (
                                        <section
                                            key={group.key}
                                            aria-labelledby={`status-${group.key}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleStatus(group.key)
                                                }
                                                className="bg-background/95 hover:bg-muted/40 sticky top-11 z-[1] flex h-9 w-full cursor-pointer items-center gap-2 border-t border-b px-3 text-left backdrop-blur transition-colors"
                                                aria-expanded={!isCollapsed}
                                                aria-controls={`group-${group.key}`}
                                            >
                                                <ChevronDown
                                                    className="text-muted-foreground size-3.5 shrink-0 transition-transform duration-200"
                                                    style={{
                                                        transform: isCollapsed
                                                            ? 'rotate(-90deg)'
                                                            : 'rotate(0deg)',
                                                    }}
                                                />
                                                <span
                                                    className="size-2.5 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            group.color,
                                                    }}
                                                />
                                                <h2
                                                    id={`status-${group.key}`}
                                                    className="text-[11px] font-semibold tracking-wide"
                                                >
                                                    {group.label}
                                                </h2>
                                                <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-[10px]">
                                                    {groupTasks.length}
                                                </span>
                                            </button>
                                            <div
                                                id={`group-${group.key}`}
                                                hidden={isCollapsed}
                                            >
                                                {groupTasks.map((task) => (
                                                    <TaskRow
                                                        key={task.id}
                                                        project={project}
                                                        task={task}
                                                        statuses={statuses}
                                                        members={members}
                                                        priorityOptions={
                                                            priorityOptions
                                                        }
                                                        canEdit={
                                                            permissions.createTask
                                                        }
                                                        canArchive={
                                                            permissions.updateProject
                                                        }
                                                    />
                                                ))}
                                                {groupTasks.length === 0 && (
                                                    <div className="bg-card text-muted-foreground border-t px-10 py-2 text-[11px]">
                                                        Belum ada tugas pada
                                                        status ini.
                                                    </div>
                                                )}
                                                {permissions.createTask &&
                                                    quickStatus && (
                                                        <QuickTaskInput
                                                            projectKey={
                                                                project.key
                                                            }
                                                            statusId={
                                                                quickStatus.id
                                                            }
                                                        />
                                                    )}
                                            </div>
                                        </section>
                                    );
                                })}
                                {statuses.length === 0 && (
                                    <div className="text-muted-foreground p-8 text-center text-sm">
                                        Pekerjaan ini belum memiliki status
                                        kerja. Atur melalui Pengaturan
                                        Pekerjaan.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <Pagination links={tasks.links} />
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
