import { router, useForm, usePage } from '@inertiajs/react';
import {
    Archive,
    CalendarDays,
    Check,
    Download,
    FileText,
    MessageSquare,
    Paperclip,
    Pencil,
    Send,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { UserAvatar } from '@/components/app/user-avatar';
import { TaskCompletion } from '@/components/tasks/task-completion';
import {
    PriorityIndicator,
    TaskLabel,
} from '@/components/tasks/task-indicators';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatFileSize, relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
    Label,
    Option,
    Project,
    TaskDetail,
    User,
    WorkflowStatus,
} from '@/types';

type Props = {
    project: Project;
    task: TaskDetail | null;
    statuses: WorkflowStatus[];
    members: User[];
    labels: Label[];
    priorityOptions: Option[];
};

export function TaskDetailSheet({
    project,
    task,
    statuses,
    members,
    labels,
    priorityOptions,
}: Props) {
    const { url } = usePage();
    const commentsRef = useRef<HTMLElement>(null);
    const commentsRequested =
        new URLSearchParams(url.split('?')[1]).get('panel') === 'comments';
    useEffect(() => {
        if (!task || !commentsRequested) return;
        setTab('comments');
        const timer = setTimeout(() => {
            commentsRef.current?.scrollIntoView({ block: 'start' });
            commentsRef.current
                ?.querySelector('textarea')
                ?.focus({ preventScroll: true });
        }, 350);
        return () => clearTimeout(timer);
    }, [task?.id, commentsRequested]);
    const [tab, setTab] = useState<'comments' | 'activity'>('comments');
    const [title, setTitle] = useState(task?.title ?? '');
    const [description, setDescription] = useState(task?.description ?? '');

    useEffect(() => {
        setTitle(task?.title ?? '');
        setDescription(task?.description ?? '');
    }, [task]);

    const close = () => {
        const params = new URLSearchParams(window.location.search);
        params.delete('task');
        params.delete('panel');
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    if (!task) return null;

    const update = (data: Record<string, string | number | null | number[]>) =>
        router.patch(
            `/projects/${project.key}/tasks/${task.task_number}`,
            data,
            { preserveScroll: true, preserveState: true },
        );
    const toggleIds = (
        field: 'assignee_ids' | 'label_ids',
        id: number,
        current: number[],
    ) =>
        update({
            [field]: current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
        });

    return (
        <Sheet
            open
            onOpenChange={(open) => {
                if (!open) close();
            }}
        >
            <SheetContent
                side="right"
                className="w-full gap-0 overflow-hidden p-0 sm:inset-y-3 sm:right-3 sm:h-[calc(100dvh-1.5rem)] sm:max-w-[min(760px,calc(100vw-1.5rem))] sm:rounded-3xl sm:border"
            >
                <SheetHeader className="border-b px-5 py-3 text-left">
                    <div className="text-muted-foreground flex items-center gap-2 pr-8 text-[11px] font-medium">
                        <span className="font-mono">{task.reference}</span>
                        <span>·</span>
                        <span>{project.name}</span>
                    </div>
                    <SheetTitle className="sr-only">{task.title}</SheetTitle>
                    <SheetDescription className="sr-only">
                        Detail tugas dan aktivitas {task.reference}
                    </SheetDescription>
                    <input
                        value={title}
                        disabled={!task.permissions.update}
                        onChange={(event) => setTitle(event.target.value)}
                        onBlur={() => {
                            if (title.trim() && title !== task.title)
                                update({ title: title.trim() });
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter')
                                event.currentTarget.blur();
                        }}
                        className="w-full bg-transparent text-xl font-semibold tracking-tight disabled:opacity-100"
                        aria-label="Judul tugas"
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <label className="bg-card flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium">
                            <TaskCompletion
                                task={task}
                                targetStatusId={
                                    task.permissions.update
                                        ? statuses.find((status) =>
                                              task.status.category === 'done'
                                                  ? status.category !== 'done'
                                                  : status.category === 'done',
                                          )?.id
                                        : null
                                }
                            />
                            {task.status.category === 'done'
                                ? 'Selesai'
                                : 'Tandai selesai'}
                        </label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setTab('comments');
                                requestAnimationFrame(() => {
                                    commentsRef.current?.scrollIntoView({
                                        block: 'start',
                                    });
                                    commentsRef.current
                                        ?.querySelector('textarea')
                                        ?.focus({ preventScroll: true });
                                });
                            }}
                        >
                            <MessageSquare className="size-4" />
                            Komentar ({task.comments.length})
                        </Button>
                    </div>
                </SheetHeader>

                <div className="sam-scrollbar min-h-0 flex-1 overflow-y-auto">
                    <section className="grid gap-x-5 gap-y-2 border-b px-5 py-4 sm:grid-cols-2">
                        <Property label="Status">
                            <Select
                                disabled={!task.permissions.update}
                                value={String(task.status_id)}
                                onValueChange={(value) =>
                                    update({ status_id: Number(value) })
                                }
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="h-8 w-full shadow-none"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem
                                            key={status.id}
                                            value={String(status.id)}
                                        >
                                            <span
                                                className="size-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        status.color,
                                                }}
                                            />
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Property>
                        <Property label="Prioritas">
                            <Select
                                disabled={!task.permissions.update}
                                value={task.priority}
                                onValueChange={(value) =>
                                    update({ priority: value })
                                }
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="h-8 w-full shadow-none"
                                >
                                    <SelectValue>
                                        <PriorityIndicator
                                            priority={task.priority}
                                        />
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
                        </Property>
                        <Property label="Penanggung jawab">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        disabled={!task.permissions.update}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-full justify-start overflow-hidden font-normal"
                                    >
                                        {task.assignees.length === 0 ? (
                                            <span className="text-muted-foreground">
                                                Belum ditugaskan
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 truncate">
                                                {task.assignees
                                                    .slice(0, 3)
                                                    .map((user) => (
                                                        <UserAvatar
                                                            key={user.id}
                                                            user={user}
                                                            className="size-5"
                                                        />
                                                    ))}
                                                <span className="truncate">
                                                    {task.assignees
                                                        .map(
                                                            (user) => user.name,
                                                        )
                                                        .join(', ')}
                                                </span>
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    className="w-72 p-2"
                                >
                                    <p className="text-muted-foreground px-2 pb-2 text-[11px] font-semibold">
                                        PENANGGUNG JAWAB
                                    </p>
                                    {members.map((member) => (
                                        <label
                                            key={member.id}
                                            className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs"
                                        >
                                            <Checkbox
                                                checked={task.assignees.some(
                                                    (user) =>
                                                        user.id === member.id,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleIds(
                                                        'assignee_ids',
                                                        member.id,
                                                        task.assignees.map(
                                                            (user) => user.id,
                                                        ),
                                                    )
                                                }
                                            />
                                            <UserAvatar
                                                user={member}
                                                className="size-5"
                                            />
                                            {member.name}
                                        </label>
                                    ))}
                                </PopoverContent>
                            </Popover>
                        </Property>
                        <Property label="Label">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        disabled={!task.permissions.update}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-full justify-start overflow-hidden font-normal"
                                    >
                                        {task.labels.length === 0 ? (
                                            <span className="text-muted-foreground">
                                                Tanpa label
                                            </span>
                                        ) : (
                                            <span className="flex gap-1 overflow-hidden">
                                                {task.labels.map((label) => (
                                                    <TaskLabel
                                                        key={label.id}
                                                        label={label}
                                                    />
                                                ))}
                                            </span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    align="start"
                                    className="w-64 p-2"
                                >
                                    {labels.length === 0 ? (
                                        <p className="text-muted-foreground px-2 py-3 text-xs">
                                            Belum ada label proyek.
                                        </p>
                                    ) : (
                                        labels.map((label) => (
                                            <label
                                                key={label.id}
                                                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs"
                                            >
                                                <Checkbox
                                                    checked={task.labels.some(
                                                        (item) =>
                                                            item.id ===
                                                            label.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleIds(
                                                            'label_ids',
                                                            label.id,
                                                            task.labels.map(
                                                                (item) =>
                                                                    item.id,
                                                            ),
                                                        )
                                                    }
                                                />
                                                <span
                                                    className="size-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            label.color,
                                                    }}
                                                />
                                                {label.name}
                                            </label>
                                        ))
                                    )}
                                </PopoverContent>
                            </Popover>
                        </Property>
                        <Property label="Tanggal mulai">
                            <Input
                                disabled={!task.permissions.update}
                                type="date"
                                className="h-8 text-xs shadow-none"
                                value={task.start_date ?? ''}
                                onChange={(event) =>
                                    update({
                                        start_date: event.target.value || null,
                                    })
                                }
                            />
                        </Property>
                        <Property label="Tenggat">
                            <Input
                                disabled={!task.permissions.update}
                                type="date"
                                className="h-8 text-xs shadow-none"
                                value={task.due_date ?? ''}
                                onChange={(event) =>
                                    update({
                                        due_date: event.target.value || null,
                                    })
                                }
                            />
                        </Property>
                    </section>

                    <section className="border-b px-5 py-5">
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                                Deskripsi
                            </h3>
                            {task.permissions.update &&
                                description !== (task.description ?? '') && (
                                    <Button
                                        size="sm"
                                        className="h-7"
                                        onClick={() => update({ description })}
                                    >
                                        Simpan
                                    </Button>
                                )}
                        </div>
                        <textarea
                            value={description}
                            disabled={!task.permissions.update}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            className="bg-background placeholder:text-muted-foreground min-h-32 w-full resize-y rounded-md border px-3 py-2.5 text-sm leading-6 disabled:border-transparent disabled:px-0"
                            placeholder="Tambahkan deskripsi, konteks, dan hasil yang diharapkan…"
                        />
                    </section>

                    <section className="border-b px-5 py-4">
                        <div className="grid gap-2 text-xs sm:grid-cols-3">
                            <Meta
                                icon={UserRound}
                                label="Dibuat oleh"
                                value={task.creator?.name ?? 'Tidak diketahui'}
                            />
                            <Meta
                                icon={CalendarDays}
                                label="Dibuat"
                                value={formatDate(task.created_at)}
                            />
                            <Meta
                                icon={CalendarDays}
                                label="Diperbarui"
                                value={relativeTime(task.updated_at)}
                            />
                        </div>
                    </section>

                    <AttachmentPanel project={project} task={task} />

                    <section ref={commentsRef}>
                        <div className="flex h-10 items-end gap-1 border-b px-5">
                            <button
                                type="button"
                                onClick={() => setTab('comments')}
                                className={cn(
                                    'text-muted-foreground relative flex h-full items-center gap-1.5 px-2 text-xs font-medium',
                                    tab === 'comments' &&
                                        'text-primary after:bg-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5',
                                )}
                            >
                                <MessageSquare className="size-3.5" />
                                Komentar{' '}
                                <span className="bg-muted rounded-full px-1.5 text-[10px]">
                                    {task.comments.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('activity')}
                                className={cn(
                                    'text-muted-foreground relative flex h-full items-center gap-1.5 px-2 text-xs font-medium',
                                    tab === 'activity' &&
                                        'text-primary after:bg-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5',
                                )}
                            >
                                Aktivitas{' '}
                                <span className="bg-muted rounded-full px-1.5 text-[10px]">
                                    {task.activity.length}
                                </span>
                            </button>
                        </div>
                        {tab === 'comments' ? (
                            <CommentsPanel project={project} task={task} />
                        ) : (
                            <ActivityPanel task={task} />
                        )}
                    </section>
                </div>

                {task.permissions.archive && (
                    <div className="bg-card flex justify-end border-t px-5 py-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-8 text-xs"
                            onClick={() =>
                                router.delete(
                                    `/projects/${project.key}/tasks/${task.task_number}`,
                                    { onSuccess: close },
                                )
                            }
                        >
                            <Archive className="size-3.5" />
                            Arsipkan tugas
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

function Property({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[86px_1fr] items-center gap-2">
            <span className="text-muted-foreground text-xs">{label}</span>
            {children}
        </div>
    );
}

function Meta({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof UserRound;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <Icon className="text-muted-foreground size-3.5" />
            <div>
                <span className="text-muted-foreground block text-[10px] tracking-wide uppercase">
                    {label}
                </span>
                <span className="font-medium">{value}</span>
            </div>
        </div>
    );
}

function AttachmentPanel({
    project,
    task,
}: {
    project: Project;
    task: TaskDetail;
}) {
    const form = useForm<{ file: File | null }>({ file: null });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!form.data.file) return;
        form.post(
            `/projects/${project.key}/tasks/${task.task_number}/attachments`,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => form.reset(),
            },
        );
    };
    return (
        <section className="border-b px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                    <Paperclip className="size-3.5" />
                    Lampiran{' '}
                    <span className="bg-muted rounded-full px-1.5 text-[10px]">
                        {task.attachments.length}
                    </span>
                </h3>
                {task.permissions.attach && (
                    <form
                        onSubmit={submit}
                        className="flex items-center gap-1.5"
                    >
                        <label className="hover:bg-muted cursor-pointer rounded-md border px-2 py-1 text-[11px]">
                            <input
                                type="file"
                                className="sr-only"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.zip"
                                onChange={(event) =>
                                    form.setData(
                                        'file',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                            {form.data.file
                                ? form.data.file.name
                                : 'Pilih file'}
                        </label>
                        <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="h-7"
                            disabled={!form.data.file || form.processing}
                        >
                            {form.processing ? <Spinner /> : 'Unggah'}
                        </Button>
                    </form>
                )}
            </div>
            {form.errors.file && (
                <p className="text-destructive mb-2 text-xs">
                    {form.errors.file}
                </p>
            )}
            {task.attachments.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                    Belum ada lampiran.
                </p>
            ) : (
                <div className="grid gap-1">
                    {task.attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-2 rounded-md border px-2.5 py-2"
                        >
                            <FileText className="text-muted-foreground size-4 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">
                                    {attachment.original_name}
                                </p>
                                <p className="text-muted-foreground text-[10px]">
                                    {formatFileSize(attachment.file_size)} ·{' '}
                                    {attachment.uploader.name}
                                </p>
                            </div>
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="size-7"
                            >
                                <a
                                    href={attachment.download_url}
                                    aria-label={`Unduh ${attachment.original_name}`}
                                >
                                    <Download className="size-3.5" />
                                </a>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function CommentsPanel({
    project,
    task,
}: {
    project: Project;
    task: TaskDetail;
}) {
    const { auth } = usePage().props;
    const form = useForm({ content: '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(
            `/projects/${project.key}/tasks/${task.task_number}/comments`,
            { preserveScroll: true, onSuccess: () => form.reset() },
        );
    };
    return (
        <div className="px-5 py-4">
            {task.permissions.comment && (
                <form onSubmit={submit} className="mb-5 flex items-start gap-2">
                    {auth.user && (
                        <UserAvatar user={auth.user} className="mt-1 size-7" />
                    )}
                    <div className="flex-1">
                        <textarea
                            value={form.data.content}
                            onChange={(event) =>
                                form.setData('content', event.target.value)
                            }
                            className="bg-background min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                            placeholder="Tulis pembaruan atau pertanyaan untuk tim…"
                            aria-label="Tulis komentar"
                        />
                        {form.errors.content && (
                            <p className="text-destructive mt-1 text-xs">
                                {form.errors.content}
                            </p>
                        )}
                        <div className="mt-1 flex justify-end">
                            <Button
                                type="submit"
                                size="sm"
                                className="h-7"
                                disabled={
                                    form.processing || !form.data.content.trim()
                                }
                            >
                                {form.processing ? (
                                    <Spinner />
                                ) : (
                                    <Send className="size-3.5" />
                                )}
                                Kirim
                            </Button>
                        </div>
                    </div>
                </form>
            )}
            <div className="grid gap-4">
                {task.comments.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-center text-xs">
                        Belum ada komentar.
                    </p>
                ) : (
                    task.comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            project={project}
                            task={task}
                            comment={comment}
                            canManage={auth.user?.id === comment.author.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function CommentItem({
    project,
    task,
    comment,
    canManage,
}: {
    project: Project;
    task: TaskDetail;
    comment: TaskDetail['comments'][number];
    canManage: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(comment.content);
    const save = () => {
        if (!content.trim() || content.trim() === comment.content) {
            setContent(comment.content);
            setEditing(false);
            return;
        }
        router.patch(
            `/projects/${project.key}/tasks/${task.task_number}/comments/${comment.id}`,
            { content: content.trim() },
            { preserveScroll: true, onSuccess: () => setEditing(false) },
        );
    };

    return (
        <div className="flex gap-2.5">
            <UserAvatar user={comment.author} className="size-7" />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                        {comment.author.name}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                        {relativeTime(comment.created_at)}
                        {comment.edited_at ? ' · diedit' : ''}
                    </span>
                    {canManage && (
                        <span className="ml-auto flex items-center gap-0.5">
                            {editing ? (
                                <>
                                    <button
                                        type="button"
                                        className="hover:bg-muted rounded p-1 text-emerald-600"
                                        aria-label="Simpan komentar"
                                        onClick={save}
                                    >
                                        <Check className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:bg-muted rounded p-1"
                                        aria-label="Batalkan perubahan"
                                        onClick={() => {
                                            setContent(comment.content);
                                            setEditing(false);
                                        }}
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1"
                                    aria-label="Edit komentar"
                                    onClick={() => setEditing(true)}
                                >
                                    <Pencil className="size-3.5" />
                                </button>
                            )}
                            <button
                                type="button"
                                className="text-muted-foreground hover:bg-muted hover:text-destructive rounded p-1"
                                aria-label="Hapus komentar"
                                onClick={() =>
                                    router.delete(
                                        `/projects/${project.key}/tasks/${task.task_number}/comments/${comment.id}`,
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        </span>
                    )}
                </div>
                {editing ? (
                    <textarea
                        autoFocus
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        onKeyDown={(event) => {
                            if (
                                (event.metaKey || event.ctrlKey) &&
                                event.key === 'Enter'
                            )
                                save();
                        }}
                        className="bg-background mt-1 min-h-20 w-full rounded-md border px-2.5 py-2 text-sm"
                    />
                ) : (
                    <p className="text-foreground/90 mt-1 text-sm leading-5 whitespace-pre-wrap">
                        {comment.content}
                    </p>
                )}
            </div>
        </div>
    );
}

function ActivityPanel({ task }: { task: TaskDetail }) {
    return (
        <div className="px-5 py-4">
            <div className="relative ml-3 border-l pl-5">
                {task.activity.length === 0 ? (
                    <p className="text-muted-foreground py-4 text-xs">
                        Belum ada aktivitas.
                    </p>
                ) : (
                    task.activity.map((activity) => (
                        <div
                            key={activity.id}
                            className="relative pb-5 last:pb-0"
                        >
                            <span className="bg-primary ring-background absolute top-1.5 -left-[25px] size-2 rounded-full ring-4" />
                            <p className="text-xs leading-5">
                                {activity.metadata.description ??
                                    activity.event}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-[10px]">
                                {relativeTime(activity.created_at)}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
