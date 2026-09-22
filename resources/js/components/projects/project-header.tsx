import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    KanbanSquare,
    LayoutDashboard,
    ListTodo,
    Settings,
} from 'lucide-react';
import { AvatarStack } from '@/components/app/user-avatar';
import { ProjectIcon } from '@/components/projects/project-icon';
import {
    HealthBadge,
    ProjectStatusBadge,
} from '@/components/tasks/task-indicators';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

const views = [
    { key: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { key: 'list', label: 'Daftar', icon: ListTodo },
    { key: 'board', label: 'Papan', icon: KanbanSquare },
    { key: 'activity', label: 'Aktivitas', icon: Activity },
];

export function ProjectHeader({
    project,
    actions,
}: {
    project: Project;
    actions?: React.ReactNode;
}) {
    const currentUrl = usePage().url;

    return (
        <div className="bg-card border-border/60 shrink-0 border-b">
            <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 py-3 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <ProjectIcon
                        projectKey={project.key}
                        className="size-10 text-xs"
                    />
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-base font-semibold tracking-tight">
                                {project.name}
                            </h1>
                            <span className="text-muted-foreground text-xs font-medium">
                                {project.key}
                            </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                            <ProjectStatusBadge
                                value={project.status}
                                label={project.status_label}
                            />
                            <HealthBadge
                                value={project.health}
                                label={project.health_label}
                            />
                            {project.members && (
                                <AvatarStack
                                    users={project.members}
                                    limit={4}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {actions}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        asChild
                    >
                        <Link
                            href={`/projects/${project.key}/settings`}
                            aria-label="Pengaturan proyek"
                        >
                            <Settings className="size-4" />
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="flex min-h-12 items-center gap-3 px-4 pb-3 md:px-6">
                <nav
                    className="bg-secondary/70 flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1"
                    aria-label="Tampilan proyek"
                >
                    {views.map((view) => {
                        const active = currentUrl.startsWith(
                            `/projects/${project.key}/${view.key}`,
                        );
                        return (
                            <Link
                                key={view.key}
                                href={`/projects/${project.key}/${view.key}`}
                                className={cn(
                                    'text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                                    active && 'bg-card text-primary shadow-sm',
                                )}
                                aria-current={active ? 'page' : undefined}
                            >
                                <view.icon className="size-3.5" />
                                {view.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
