import type { ReactNode } from 'react';
import { ProjectHeader } from '@/components/projects/project-header';
import type { Project } from '@/types';

export function ProjectPage({
    project,
    actions,
    children,
    className = '',
}: {
    project: Project;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <ProjectHeader project={project} actions={actions} />
            <div className={`min-h-0 flex-1 ${className}`}>{children}</div>
        </div>
    );
}
