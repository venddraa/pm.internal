import { cn } from '@/lib/utils';

const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200',
    'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-200',
    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
];

export function ProjectIcon({
    projectKey,
    className,
}: {
    projectKey: string;
    className?: string;
}) {
    const hash = Array.from(projectKey).reduce(
        (sum, value) => sum + value.charCodeAt(0),
        0,
    );
    return (
        <span
            className={cn(
                'inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tracking-tight',
                colors[hash % colors.length],
                className,
            )}
            aria-hidden="true"
        >
            {projectKey.slice(0, 3)}
        </span>
    );
}
