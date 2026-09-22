import { router } from '@inertiajs/react';
import { Copy, MessageSquare, MoreHorizontal, UserPlus } from 'lucide-react';
import { AvatarStack, UserAvatar } from '@/components/app/user-avatar';
import { TaskCompletion } from '@/components/tasks/task-completion';
import {
    DueDate,
    PriorityIndicator,
    WorkflowBadge,
} from '@/components/tasks/task-indicators';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Option, Project, Task, User, WorkflowStatus } from '@/types';

type Props = {
    project: Project;
    task: Task;
    statuses: WorkflowStatus[];
    members: User[];
    priorityOptions: Option[];
    canEdit: boolean;
    canArchive?: boolean;
};

export function TaskRow({
    project,
    task,
    statuses,
    members,
    priorityOptions,
    canEdit,
    canArchive = false,
}: Props) {
    const update = (data: Record<string, string | number | null | number[]>) =>
        router.patch(
            `/projects/${project.key}/tasks/${task.task_number}`,
            data,
            { preserveScroll: true, preserveState: true },
        );
    const openTask = (comments = false) => {
        const params = new URLSearchParams(window.location.search);
        params.set('task', String(task.task_number));
        if (comments) params.set('panel', 'comments');
        else params.delete('panel');
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };
    const done = task.status.category === 'done';
    const target = statuses.find((status) =>
        done ? status.category !== 'done' : status.category === 'done',
    );
    return (
        <div className="sam-task-grid group bg-card hover:bg-muted/25 min-h-16 items-center border-t text-sm transition-colors">
            <div className="flex min-w-0 items-center gap-3 px-4 py-3">
                <TaskCompletion
                    task={task}
                    targetStatusId={canEdit ? target?.id : null}
                />
                <button
                    type="button"
                    onClick={() => openTask()}
                    className="hover:text-primary min-w-0 text-left"
                >
                    <span
                        className={`block truncate font-medium ${done ? 'text-muted-foreground line-through' : ''}`}
                    >
                        {task.title}
                    </span>
                    <span className="text-muted-foreground mt-1 block font-mono text-[10px]">
                        {task.reference}
                    </span>
                </button>
            </div>
            <div className="px-2">
                {canEdit ? (
                    <Select
                        value={String(task.status_id)}
                        onValueChange={(value) =>
                            update({ status_id: Number(value) })
                        }
                    >
                        <SelectTrigger
                            className="h-8 w-full border-transparent bg-transparent px-1 shadow-none"
                            aria-label={`Status ${task.reference}`}
                        >
                            <SelectValue>
                                <WorkflowBadge status={task.status} />
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {statuses.map((status) => (
                                <SelectItem
                                    key={status.id}
                                    value={String(status.id)}
                                >
                                    {status.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <WorkflowBadge status={task.status} />
                )}
            </div>
            <div className="px-2">
                {canEdit ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                aria-label={`Penanggung jawab ${task.reference}`}
                                className="hover:bg-muted flex min-h-9 w-full items-center gap-2 rounded-lg px-1.5"
                            >
                                {task.assignees.length ? (
                                    <AvatarStack users={task.assignees} />
                                ) : (
                                    <>
                                        <UserPlus className="text-muted-foreground size-4" />
                                        <span className="text-muted-foreground text-xs">
                                            Tugaskan
                                        </span>
                                    </>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-2">
                            <p className="px-2 py-2 text-sm font-semibold">
                                Tugaskan kepada
                            </p>
                            <div className="max-h-56 overflow-auto">
                                {members.map((member) => (
                                    <label
                                        key={member.id}
                                        className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2"
                                    >
                                        <Checkbox
                                            checked={task.assignees.some(
                                                (user) => user.id === member.id,
                                            )}
                                            onCheckedChange={() => {
                                                const ids = task.assignees.map(
                                                    (user) => user.id,
                                                );
                                                update({
                                                    assignee_ids: ids.includes(
                                                        member.id,
                                                    )
                                                        ? ids.filter(
                                                              (id) =>
                                                                  id !==
                                                                  member.id,
                                                          )
                                                        : [...ids, member.id],
                                                });
                                            }}
                                        />
                                        <UserAvatar
                                            user={member}
                                            className="size-6"
                                        />
                                        <span className="truncate text-sm">
                                            {member.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <AvatarStack users={task.assignees} />
                )}
            </div>
            <div className="px-2">
                {canEdit ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button
                                type="button"
                                aria-label={`Tenggat ${task.reference}`}
                                className="hover:bg-muted flex min-h-9 items-center rounded-lg px-1"
                            >
                                <DueDate
                                    date={task.due_date}
                                    completed={done}
                                />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56">
                            <label className="grid gap-2 text-sm">
                                Tenggat
                                <input
                                    type="date"
                                    defaultValue={task.due_date ?? ''}
                                    onChange={(event) =>
                                        update({
                                            due_date:
                                                event.target.value || null,
                                        })
                                    }
                                    className="bg-background h-10 rounded-lg border px-2"
                                />
                            </label>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <DueDate date={task.due_date} completed={done} />
                )}
            </div>
            <div className="px-2">
                {canEdit ? (
                    <Select
                        value={task.priority}
                        onValueChange={(priority) => update({ priority })}
                    >
                        <SelectTrigger
                            aria-label={`Prioritas ${task.reference}`}
                            className="h-8 w-full border-transparent bg-transparent px-1 shadow-none"
                        >
                            <SelectValue>
                                <PriorityIndicator priority={task.priority} />
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {priorityOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <PriorityIndicator priority={task.priority} />
                )}
            </div>
            <button
                type="button"
                onClick={() => openTask(true)}
                aria-label={`Komentar ${task.reference}`}
                className="text-muted-foreground hover:text-primary flex items-center justify-center gap-1.5 px-2 py-3 text-xs"
            >
                <MessageSquare className="size-4" />
                {task.comments_count || 'Tulis'}
            </button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Tindakan untuk ${task.reference}`}
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openTask()}>
                        Buka detail tugas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() =>
                            navigator.clipboard.writeText(task.reference)
                        }
                    >
                        <Copy className="size-4" />
                        Salin ID tugas
                    </DropdownMenuItem>
                    {canArchive && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                    router.delete(
                                        `/projects/${project.key}/tasks/${task.task_number}`,
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                Arsipkan tugas
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
