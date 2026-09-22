import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CircleDot,
    Clock3,
    UserRound,
} from 'lucide-react';
import { AvatarStack } from '@/components/app/user-avatar';
import { ProjectPage } from '@/components/projects/project-page';
import { Progress } from '@/components/ui/progress';
import { formatDate, relativeTime } from '@/lib/format';
import type { Activity, Project, WorkflowStatus } from '@/types';

export default function ProjectOverview({
    project,
    metrics,
    tasksByStatus,
    recentActivity,
}: {
    project: Project;
    metrics: { open: number; overdue: number; due_soon: number };
    tasksByStatus: WorkflowStatus[];
    recentActivity: Activity[];
}) {
    const maxStatus = Math.max(
        ...tasksByStatus.map((status) => status.task_count ?? 0),
        1,
    );
    return (
        <>
            <Head title={`${project.key} Ringkasan`} />
            <ProjectPage project={project}>
                <div className="sam-scrollbar h-full overflow-y-auto p-4 md:p-6">
                    <div className="bg-card border-border/60 mx-auto max-w-6xl overflow-hidden rounded-2xl border shadow-sm">
                        <section className="grid gap-5 border-b p-5 lg:grid-cols-[1.4fr_1fr]">
                            <div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium">
                                            Progres proyek
                                        </p>
                                        <p className="mt-1 text-3xl font-semibold tracking-tight">
                                            {project.progress.percent}%
                                        </p>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        <span className="text-foreground font-semibold">
                                            {project.progress.completed}
                                        </span>{' '}
                                        / {project.progress.total} tugas selesai
                                    </p>
                                </div>
                                <Progress
                                    value={project.progress.percent}
                                    className="mt-4 h-2"
                                />
                                {project.description && (
                                    <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-6">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-3 divide-x rounded-md border">
                                <Metric
                                    icon={CircleDot}
                                    label="Terbuka"
                                    value={metrics.open}
                                />
                                <Metric
                                    icon={AlertTriangle}
                                    label="Terlambat"
                                    value={metrics.overdue}
                                    tone={
                                        metrics.overdue > 0
                                            ? 'danger'
                                            : undefined
                                    }
                                />
                                <Metric
                                    icon={Clock3}
                                    label="Tenggat minggu ini"
                                    value={metrics.due_soon}
                                />
                            </div>
                        </section>
                        <div className="grid lg:grid-cols-[1.3fr_0.7fr]">
                            <section className="border-b p-5 lg:border-r lg:border-b-0">
                                <h2 className="text-sm font-semibold">
                                    Tugas per status
                                </h2>
                                <div className="mt-4 grid gap-3">
                                    {tasksByStatus.map((status) => (
                                        <div
                                            key={status.id}
                                            className="grid grid-cols-[120px_1fr_34px] items-center gap-3"
                                        >
                                            <span className="flex items-center gap-2 truncate text-xs font-medium">
                                                <span
                                                    className="size-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            status.color,
                                                    }}
                                                />
                                                {status.name}
                                            </span>
                                            <div className="bg-muted h-2 overflow-hidden rounded-full">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${((status.task_count ?? 0) / maxStatus) * 100}%`,
                                                        backgroundColor:
                                                            status.color,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-muted-foreground text-right text-xs">
                                                {status.task_count ?? 0}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-7 grid gap-4 border-t pt-5 sm:grid-cols-3">
                                    <OverviewMeta
                                        icon={UserRound}
                                        label="Pemilik proyek"
                                        value={project.owner.name}
                                    />
                                    <OverviewMeta
                                        icon={CalendarDays}
                                        label="Tanggal mulai"
                                        value={formatDate(project.start_date)}
                                    />
                                    <OverviewMeta
                                        icon={CalendarDays}
                                        label="Tenggat"
                                        value={formatDate(project.due_date)}
                                    />
                                </div>
                                <div className="mt-5">
                                    <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-wider uppercase">
                                        Anggota
                                    </p>
                                    {project.members && (
                                        <div className="flex items-center gap-2">
                                            <AvatarStack
                                                users={project.members}
                                                limit={6}
                                            />
                                            <span className="text-muted-foreground text-xs">
                                                {project.member_count} orang
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </section>
                            <section className="p-5">
                                <h2 className="text-sm font-semibold">
                                    Aktivitas terbaru
                                </h2>
                                <div className="relative mt-4 ml-3 border-l pl-5">
                                    {recentActivity.length === 0 ? (
                                        <p className="text-muted-foreground text-xs">
                                            Belum ada aktivitas terbaru.
                                        </p>
                                    ) : (
                                        recentActivity.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="relative pb-5 last:pb-0"
                                            >
                                                <span className="bg-primary ring-card absolute top-1 -left-[25px] size-2 rounded-full ring-4" />
                                                <p className="text-xs leading-5">
                                                    {activity.metadata
                                                        .description ??
                                                        activity.event}
                                                </p>
                                                <p className="text-muted-foreground text-[10px]">
                                                    {relativeTime(
                                                        activity.created_at,
                                                    )}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </ProjectPage>
        </>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: typeof CircleDot;
    label: string;
    value: number;
    tone?: 'danger';
}) {
    return (
        <div className="flex flex-col justify-center px-3 py-4 text-center">
            <Icon
                className={`mx-auto mb-2 size-4 ${tone === 'danger' ? 'text-red-600' : 'text-muted-foreground'}`}
            />
            <span
                className={`text-xl font-semibold ${tone === 'danger' ? 'text-red-600' : ''}`}
            >
                {value}
            </span>
            <span className="text-muted-foreground mt-0.5 text-[10px]">
                {label}
            </span>
        </div>
    );
}
function OverviewMeta({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UserRound;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2">
            <Icon className="text-muted-foreground mt-0.5 size-3.5" />
            <div>
                <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
                    {label}
                </p>
                <p className="mt-0.5 text-xs font-medium">{value}</p>
            </div>
        </div>
    );
}
