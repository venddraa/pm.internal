import { CalendarDays, Circle, Flag, TriangleAlert } from 'lucide-react';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type {
    Label,
    ProjectHealthValue,
    ProjectStatusValue,
    TaskPriorityValue,
    WorkflowStatus,
} from '@/types';

export function TaskLabel({ label }: { label: Label }) {
    return (
        <span
            className="sam-task-label rounded-full px-2 py-0.5 text-[11px]"
            style={{ '--task-label-color': label.color } as CSSProperties}
        >
            {label.name}
        </span>
    );
}

const priorityClasses: Record<TaskPriorityValue, string> = {
    urgent: 'text-red-600 dark:text-red-400',
    high: 'text-orange-600 dark:text-orange-400',
    normal: 'text-blue-600 dark:text-blue-400',
    low: 'text-slate-500 dark:text-slate-400',
    none: 'text-slate-400 dark:text-slate-500',
};

const priorityLabels: Record<TaskPriorityValue, string> = {
    urgent: 'Mendesak',
    high: 'Tinggi',
    normal: 'Normal',
    low: 'Rendah',
    none: 'Tanpa prioritas',
};

export function PriorityIndicator({
    priority,
    compact = false,
}: {
    priority: TaskPriorityValue;
    compact?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 text-xs',
                priorityClasses[priority],
            )}
        >
            <Flag className="size-3.5 fill-current/10" aria-hidden="true" />
            {!compact && <span>{priorityLabels[priority]}</span>}
            <span className="sr-only">
                Prioritas: {priorityLabels[priority]}
            </span>
        </span>
    );
}

export function WorkflowBadge({ status }: { status: WorkflowStatus }) {
    return (
        <span className="bg-muted text-foreground inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide">
            <Circle
                className="size-2.5 fill-current"
                style={{ color: status.color }}
                aria-hidden="true"
            />
            {status.name}
        </span>
    );
}

const projectStatusClasses: Record<ProjectStatusValue, string> = {
    planning:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    active: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
    on_hold: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
    completed:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
    archived:
        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export function ProjectStatusBadge({
    value,
    label,
}: {
    value: ProjectStatusValue;
    label: string;
}) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-1 text-[11px] font-medium',
                projectStatusClasses[value],
            )}
        >
            {label}
        </span>
    );
}

const healthClasses: Record<ProjectHealthValue, string> = {
    on_track: 'text-emerald-700 dark:text-emerald-400',
    at_risk: 'text-amber-700 dark:text-amber-400',
    off_track: 'text-red-700 dark:text-red-400',
};

export function HealthBadge({
    value,
    label,
}: {
    value: ProjectHealthValue;
    label: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium',
                healthClasses[value],
            )}
        >
            {value === 'off_track' ? (
                <TriangleAlert className="size-3.5" />
            ) : (
                <Circle className="size-2.5 fill-current" />
            )}
            {label}
        </span>
    );
}

export function DueDate({
    date,
    completed = false,
}: {
    date: string | null;
    completed?: boolean;
}) {
    if (!date)
        return (
            <span className="text-muted-foreground text-xs">Tanpa tanggal</span>
        );
    const parsed = new Date(`${date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = !completed && parsed < today;
    return (
        <span
            className={cn(
                'text-muted-foreground inline-flex items-center gap-1.5 text-xs',
                overdue && 'font-medium text-red-600 dark:text-red-400',
            )}
        >
            <CalendarDays className="size-3.5" />
            {parsed.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
            })}
            {overdue && <span className="sr-only">Terlambat</span>}
        </span>
    );
}
