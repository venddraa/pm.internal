import { Link } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import { TaskCompletion } from '@/components/tasks/task-completion';
import { DueDate, WorkflowBadge } from '@/components/tasks/task-indicators';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

export function TaskSummaryRow({
    task,
    showProject = true,
}: {
    task: Task;
    showProject?: boolean;
}) {
    const href = `/projects/${task.project.key}/list?task=${task.task_number}`;
    return (
        <div className="bg-card hover:bg-muted/25 flex items-start gap-3 border-t px-4 py-4 transition-colors">
            <div className="pt-1">
                <TaskCompletion task={task} />
            </div>
            <div className="min-w-0 flex-1">
                <Link
                    href={href}
                    className={cn(
                        'hover:text-primary block text-sm leading-5 font-medium',
                        task.status.category === 'done' &&
                            'text-muted-foreground line-through',
                    )}
                >
                    {task.title}
                </Link>
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                    {showProject && <span>{task.project.name}</span>}
                    <span className="font-mono text-[10px]">
                        {task.reference}
                    </span>
                    <WorkflowBadge status={task.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <DueDate
                        date={task.due_date}
                        completed={task.status.category === 'done'}
                    />
                    <Link
                        href={`${href}&panel=comments`}
                        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-xs"
                        aria-label={`Komentar ${task.reference}`}
                    >
                        <MessageSquare className="size-3.5" />
                        Komentar
                        {task.comments_count ? ` (${task.comments_count})` : ''}
                    </Link>
                </div>
            </div>
        </div>
    );
}
