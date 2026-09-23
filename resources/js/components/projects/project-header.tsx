import { Link } from '@inertiajs/react';
import { Settings } from 'lucide-react';
import { AvatarStack } from '@/components/app/user-avatar';
import { ProjectIcon } from '@/components/projects/project-icon';
import {
    HealthBadge,
    ProjectStatusBadge,
} from '@/components/tasks/task-indicators';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types';

export function ProjectHeader({
    project,
    actions,
    canManage = false,
}: {
    project: Project;
    actions?: React.ReactNode;
    canManage?: boolean;
}) {
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
                    {canManage && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            asChild
                        >
                            <Link
                                href={`/projects/${project.key}/settings`}
                                aria-label="Pengaturan pekerjaan"
                            >
                                <Settings className="size-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
