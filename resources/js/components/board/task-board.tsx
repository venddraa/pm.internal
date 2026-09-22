import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import { GripVertical } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AvatarStack } from '@/components/app/user-avatar';
import { QuickTaskInput } from '@/components/tasks/quick-task-input';
import {
    DueDate,
    PriorityIndicator,
    TaskLabel,
} from '@/components/tasks/task-indicators';
import { cn } from '@/lib/utils';
import type { Project, Task, WorkflowStatus } from '@/types';

const taskDragId = (id: number) => `task-${id}`;
const statusDropId = (id: number) => `status-${id}`;
const parseId = (value: string | number) => Number(String(value).split('-')[1]);

export function TaskBoard({
    project,
    statuses,
    initialTasks,
    canEdit,
    onOpenTask,
}: {
    project: Project;
    statuses: WorkflowStatus[];
    initialTasks: Task[];
    canEdit: boolean;
    onOpenTask: (task: Task) => void;
}) {
    const [tasks, setTasks] = useState(initialTasks);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    useEffect(() => setTasks(initialTasks), [initialTasks]);

    const grouped = useMemo(
        () =>
            new Map(
                statuses.map((status) => [
                    status.id,
                    tasks
                        .filter((task) => task.status_id === status.id)
                        .sort((a, b) => a.position - b.position),
                ]),
            ),
        [statuses, tasks],
    );

    const handleStart = (event: DragStartEvent) =>
        setActiveTask(
            tasks.find((task) => task.id === parseId(event.active.id)) ?? null,
        );
    const handleEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        if (!event.over || !canEdit) return;
        const moved = tasks.find(
            (task) => task.id === parseId(event.active.id),
        );
        if (!moved) return;
        const overValue = String(event.over.id);
        const targetStatusId = overValue.startsWith('status-')
            ? parseId(overValue)
            : tasks.find((task) => task.id === parseId(overValue))?.status_id;
        if (!targetStatusId) return;
        const destination = [...(grouped.get(targetStatusId) ?? [])].filter(
            (task) => task.id !== moved.id,
        );
        const overTaskIndex = overValue.startsWith('task-')
            ? destination.findIndex((task) => task.id === parseId(overValue))
            : destination.length;
        const targetIndex =
            overTaskIndex < 0 ? destination.length : overTaskIndex;
        destination.splice(targetIndex, 0, {
            ...moved,
            status_id: targetStatusId,
            status:
                statuses.find((status) => status.id === targetStatusId) ??
                moved.status,
        });

        const source = (grouped.get(moved.status_id) ?? []).filter(
            (task) => task.id !== moved.id,
        );
        setTasks((current) =>
            current.map((task) => {
                const destinationIndex = destination.findIndex(
                    (item) => item.id === task.id,
                );
                if (destinationIndex >= 0)
                    return {
                        ...destination[destinationIndex],
                        position: (destinationIndex + 1) * 1024,
                    };
                const sourceIndex = source.findIndex(
                    (item) => item.id === task.id,
                );
                return sourceIndex >= 0
                    ? { ...task, position: (sourceIndex + 1) * 1024 }
                    : task;
            }),
        );

        router.patch(
            `/projects/${project.key}/tasks/${moved.task_number}/move`,
            { status_id: targetStatusId, target_index: targetIndex },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleStart}
            onDragEnd={handleEnd}
            onDragCancel={() => setActiveTask(null)}
        >
            <div className="sam-scrollbar flex h-full min-h-0 gap-4 overflow-x-auto overflow-y-hidden p-4">
                {statuses.map((status) => (
                    <BoardColumn
                        key={status.id}
                        project={project}
                        status={status}
                        tasks={grouped.get(status.id) ?? []}
                        canEdit={canEdit}
                        onOpenTask={onOpenTask}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeTask ? (
                    <TaskCardContent task={activeTask} dragging />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function BoardColumn({
    project,
    status,
    tasks,
    canEdit,
    onOpenTask,
}: {
    project: Project;
    status: WorkflowStatus;
    tasks: Task[];
    canEdit: boolean;
    onOpenTask: (task: Task) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: statusDropId(status.id),
        disabled: !canEdit,
    });
    return (
        <section
            className="bg-secondary/70 flex h-full w-[300px] shrink-0 flex-col rounded-3xl p-3"
            aria-labelledby={`board-status-${status.id}`}
        >
            <div className="flex h-10 shrink-0 items-center gap-2 px-2 pb-2">
                <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                />
                <h2
                    id={`board-status-${status.id}`}
                    className="text-[11px] font-semibold tracking-wide"
                >
                    {status.name}
                </h2>
                <span className="bg-muted text-muted-foreground rounded-full px-1.5 text-[10px]">
                    {tasks.length}
                </span>
            </div>
            <div
                ref={setNodeRef}
                className={cn(
                    'sam-scrollbar min-h-20 flex-1 overflow-y-auto rounded-2xl border border-transparent p-0.5 transition-colors',
                    isOver && 'border-primary/40 bg-primary/5',
                )}
            >
                <SortableContext
                    items={tasks.map((task) => taskDragId(task.id))}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="grid gap-3">
                        {tasks.map((task) => (
                            <SortableTaskCard
                                key={task.id}
                                task={task}
                                disabled={!canEdit}
                                onOpen={() => onOpenTask(task)}
                            />
                        ))}
                    </div>
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="text-muted-foreground flex h-20 items-center justify-center rounded-md border border-dashed text-[11px]">
                        Letakkan tugas di sini
                    </div>
                )}
            </div>
            {canEdit && (
                <div className="bg-card border-border/60 mt-3 overflow-hidden rounded-2xl border">
                    <QuickTaskInput
                        projectKey={project.key}
                        statusId={status.id}
                    />
                </div>
            )}
        </section>
    );
}

function SortableTaskCard({
    task,
    disabled,
    onOpen,
}: {
    task: Task;
    disabled: boolean;
    onOpen: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: taskDragId(task.id), disabled });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(isDragging && 'opacity-30')}
        >
            <TaskCardContent
                task={task}
                onOpen={onOpen}
                handleProps={{ ...attributes, ...listeners }}
            />
        </div>
    );
}

function TaskCardContent({
    task,
    onOpen,
    handleProps,
    dragging = false,
}: {
    task: Task;
    onOpen?: () => void;
    handleProps?: Record<string, unknown>;
    dragging?: boolean;
}) {
    return (
        <article
            className={cn(
                'group bg-card border-border/60 rounded-2xl border p-4 shadow-[0_3px_12px_rgba(15,45,80,0.05)] transition-shadow hover:shadow-md',
                dragging && 'w-[274px] shadow-lg',
            )}
        >
            <div className="flex items-start gap-1">
                <button
                    type="button"
                    onClick={onOpen}
                    className="min-w-0 flex-1 text-left"
                >
                    <span className="text-muted-foreground block font-mono text-[10px] font-medium">
                        {task.reference}
                    </span>
                    <span className="text-foreground hover:text-primary mt-1 block text-[13px] leading-5 font-medium">
                        {task.title}
                    </span>
                </button>
                {handleProps && (
                    <button
                        type="button"
                        {...handleProps}
                        className="text-muted-foreground hover:bg-muted cursor-grab rounded p-1 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                        aria-label={`Pindahkan ${task.reference}`}
                    >
                        <GripVertical className="size-3.5" />
                    </button>
                )}
            </div>
            {task.labels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {task.labels.slice(0, 3).map((label) => (
                        <TaskLabel key={label.id} label={label} />
                    ))}
                </div>
            )}
            <div className="mt-3 flex items-center gap-2">
                <PriorityIndicator priority={task.priority} compact />
                <DueDate
                    date={task.due_date}
                    completed={task.status.category === 'done'}
                />
                <span className="ml-auto">
                    <AvatarStack users={task.assignees} />
                </span>
            </div>
        </article>
    );
}
