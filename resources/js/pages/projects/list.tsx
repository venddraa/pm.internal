import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ListTodo } from 'lucide-react';
import * as React from 'react';
import { Pagination } from '@/components/app/pagination';
import { ProjectPage } from '@/components/projects/project-page';
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
    permissions,
}: Props) {
    const grouped = new Map(
        statuses.map((status) => [
            status.id,
            tasks.data.filter((task) => task.status_id === status.id),
        ]),
    );

    const storageKey = `collapsed-statuses-${project.key}`;

    const [collapsed, setCollapsed] = React.useState<Record<number, boolean>>(
        () => {
            try {
                const stored = sessionStorage.getItem(storageKey);
                return stored
                    ? (JSON.parse(stored) as Record<number, boolean>)
                    : {};
            } catch {
                return {};
            }
        },
    );

    const toggleStatus = (statusId: number) => {
        setCollapsed((prev) => {
            const next = { ...prev, [statusId]: !prev[statusId] };
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
            <Head title={`${project.key} Daftar`} />
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
                    <div className="sam-scrollbar min-h-0 flex-1 overflow-auto">
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
                                        ? 'Sesuaikan filter atau tampilkan semua tugas dalam proyek.'
                                        : 'Tambahkan anggota proyek, buat tugas, lalu pilih penanggung jawab. Tugas akan muncul di Tugas Saya milik orang tersebut.'}
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
                                                Kelola anggota
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
                                {statuses.map((status) => {
                                    const groupTasks =
                                        grouped.get(status.id) ?? [];
                                    const isCollapsed = !!collapsed[status.id];
                                    return (
                                        <section
                                            key={status.id}
                                            aria-labelledby={`status-${status.id}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleStatus(status.id)
                                                }
                                                className="bg-background/95 hover:bg-muted/40 sticky top-11 z-[1] flex h-9 w-full cursor-pointer items-center gap-2 border-t border-b px-3 text-left backdrop-blur transition-colors"
                                                aria-expanded={!isCollapsed}
                                                aria-controls={`group-${status.id}`}
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
                                                            status.color,
                                                    }}
                                                />
                                                <h2
                                                    id={`status-${status.id}`}
                                                    className="text-[11px] font-semibold tracking-wide"
                                                >
                                                    {status.name}
                                                </h2>
                                                <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-[10px]">
                                                    {status.task_count ??
                                                        groupTasks.length}
                                                </span>
                                            </button>
                                            <div
                                                id={`group-${status.id}`}
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
                                                {permissions.createTask && (
                                                    <QuickTaskInput
                                                        projectKey={project.key}
                                                        statusId={status.id}
                                                    />
                                                )}
                                            </div>
                                        </section>
                                    );
                                })}
                                {statuses.length === 0 && (
                                    <div className="text-muted-foreground p-8 text-center text-sm">
                                        Proyek ini belum memiliki status kerja.
                                        Atur melalui Pengaturan Proyek.
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
