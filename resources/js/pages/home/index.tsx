import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    CheckCircle2,
    Circle,
    Clock3,
    ExternalLink,
    FileText,
    Link2,
    MessageSquare,
    Paperclip,
    Plus,
    Search,
    Send,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Pagination } from '@/components/app/pagination';
import { UserAvatar } from '@/components/app/user-avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Paginated, Task, TaskDetail, User } from '@/types';

type Area = { id: number; name: string; key: string };
type StatusOption = { value: string; label: string; color: string };
type Filters = {
    view: 'all' | 'mine' | 'today' | 'waiting' | 'done';
    search?: string;
    area?: number;
    person?: number;
    task?: number;
};
type Stats = {
    open: number;
    mine: number;
    today: number;
    waiting: number;
    unassigned: number;
};

const viewItems = [
    { value: 'all', label: 'Semua aktif' },
    { value: 'mine', label: 'Tugas saya' },
    { value: 'today', label: 'Hari ini' },
    { value: 'waiting', label: 'Menunggu' },
    { value: 'done', label: 'Selesai' },
] as const;

function formatSchedule(value: string | null) {
    if (!value) return null;
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function toDateTimeInput(value: string | null) {
    if (!value) return '';
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
}

function cleanFilters(filters: Filters) {
    return {
        view: filters.view === 'all' ? undefined : filters.view,
        search: filters.search || undefined,
        area: filters.area || undefined,
        person: filters.person || undefined,
    };
}

function CreateAgendaDialog({
    open,
    onOpenChange,
    areas,
    people,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    areas: Area[];
    people: User[];
}) {
    const form = useForm({
        title: '',
        area_id: areas[0]?.id ?? 0,
        description: '',
        scheduled_at: '',
        assignee_ids: [] as number[],
    });

    const toggleAssignee = (id: number) => {
        form.setData(
            'assignee_ids',
            form.data.assignee_ids.includes(id)
                ? form.data.assignee_ids.filter((userId) => userId !== id)
                : [...form.data.assignee_ids, id],
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            scheduled_at: data.scheduled_at || null,
            description: data.description || null,
        }));
        form.post('/agenda/tasks', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Tambah pekerjaan</DialogTitle>
                    <DialogDescription>
                        Catat instruksi kerja seperti saat membagikannya di
                        grup. Jadwal dan orang yang ditugaskan boleh diisi
                        belakangan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="agenda-title">
                            Apa yang perlu dikerjakan?
                        </Label>
                        <Input
                            id="agenda-title"
                            autoFocus
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            placeholder="Contoh: Survey penambahan titik RO3"
                            className="h-11"
                        />
                        {form.errors.title && (
                            <p className="text-destructive text-xs">
                                {form.errors.title}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="agenda-area">Area pekerjaan</Label>
                            <select
                                id="agenda-area"
                                value={form.data.area_id}
                                onChange={(event) =>
                                    form.setData(
                                        'area_id',
                                        Number(event.target.value),
                                    )
                                }
                                className="border-input bg-background h-10 rounded-md border px-3 text-sm outline-none focus:border-[var(--sam-field-focus)]"
                            >
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="agenda-schedule">
                                Jadwal{' '}
                                <span className="text-muted-foreground">
                                    (opsional)
                                </span>
                            </Label>
                            <Input
                                id="agenda-schedule"
                                type="datetime-local"
                                value={form.data.scheduled_at}
                                onChange={(event) =>
                                    form.setData(
                                        'scheduled_at',
                                        event.target.value,
                                    )
                                }
                                className="h-10"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>
                            Ditugaskan kepada{' '}
                            <span className="text-muted-foreground">
                                (opsional)
                            </span>
                        </Label>
                        <div className="grid max-h-44 gap-1 overflow-y-auto rounded-xl border p-2 sm:grid-cols-2">
                            {people.map((person) => {
                                const selected =
                                    form.data.assignee_ids.includes(person.id);
                                return (
                                    <button
                                        key={person.id}
                                        type="button"
                                        onClick={() =>
                                            toggleAssignee(person.id)
                                        }
                                        className={cn(
                                            'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                                            selected
                                                ? 'bg-primary/10 text-foreground'
                                                : 'hover:bg-muted',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded border',
                                                selected
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-input',
                                            )}
                                        >
                                            {selected && (
                                                <Check className="size-3" />
                                            )}
                                        </span>
                                        <UserAvatar
                                            user={person}
                                            className="size-6"
                                        />
                                        <span className="truncate">
                                            {person.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="agenda-instruction">
                            Arahan singkat{' '}
                            <span className="text-muted-foreground">
                                (opsional)
                            </span>
                        </Label>
                        <textarea
                            id="agenda-instruction"
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            placeholder="Konteks, lokasi, atau hal yang perlu diperhatikan…"
                            rows={3}
                            className="border-input bg-background placeholder:text-muted-foreground resize-y rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--sam-field-focus)]"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                !form.data.title.trim() ||
                                !form.data.area_id
                            }
                        >
                            {form.processing && <Spinner />}
                            Tambahkan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
    const schedule = formatSchedule(task.scheduled_at);
    const assigneeNames = task.assignees
        .map((person) => person.name)
        .join(', ');

    return (
        <button
            type="button"
            onClick={onClick}
            className="hover:bg-muted/35 grid w-full gap-3 border-t px-4 py-4 text-left transition-colors md:grid-cols-[minmax(250px,1fr)_155px_170px_135px_130px] md:items-center md:px-5"
        >
            <span className="flex min-w-0 items-start gap-3">
                <span
                    className="mt-1.5 size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: task.agenda_status_color }}
                />
                <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                        {task.title}
                    </span>
                    <span className="text-muted-foreground mt-1 flex min-w-0 items-center gap-2 text-xs">
                        <span className="truncate">
                            {task.status_note ||
                                task.next_action ||
                                'Belum ada catatan terbaru'}
                        </span>
                        {task.result_notes && (
                            <FileText className="size-3.5 shrink-0" />
                        )}
                        {(task.comments_count ?? 0) > 0 && (
                            <span className="flex shrink-0 items-center gap-1">
                                <MessageSquare className="size-3" />
                                {task.comments_count}
                            </span>
                        )}
                    </span>
                </span>
            </span>
            <span className="text-muted-foreground flex items-center gap-2 text-xs md:block">
                <span className="md:hidden">Area:</span>
                <span className="bg-muted text-foreground inline-flex max-w-full truncate rounded-md px-2 py-1 font-medium">
                    {task.project.name}
                </span>
            </span>
            <span
                className={cn(
                    'flex min-w-0 items-center gap-2 text-xs',
                    task.assignees.length === 0
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-muted-foreground',
                )}
            >
                <UserRound className="size-3.5 shrink-0" />
                <span className="truncate">
                    {assigneeNames || 'Belum ditugaskan'}
                </span>
            </span>
            <span className="text-muted-foreground hidden items-center gap-1.5 text-xs md:flex">
                <CalendarDays className="size-3.5 shrink-0" />
                {schedule || 'Tanpa jadwal'}
            </span>
            <span className="flex items-center justify-between gap-3 md:justify-start">
                <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                        color: task.agenda_status_color,
                        backgroundColor: `${task.agenda_status_color}14`,
                    }}
                >
                    {task.agenda_status === 'done' ? (
                        <CheckCircle2 className="size-3.5" />
                    ) : (
                        <Circle className="size-3.5" />
                    )}
                    {task.agenda_status_label}
                </span>
                {schedule && (
                    <span className="text-muted-foreground flex items-center gap-1 text-[11px] md:hidden">
                        <CalendarDays className="size-3" />
                        {schedule}
                    </span>
                )}
            </span>
        </button>
    );
}

function TaskDetailSheet({
    task,
    people,
    statusOptions,
    onClose,
}: {
    task: TaskDetail | null;
    people: User[];
    statusOptions: StatusOption[];
    onClose: () => void;
}) {
    return (
        <Sheet open={task !== null} onOpenChange={(open) => !open && onClose()}>
            {task && (
                <SheetContent
                    side="right"
                    className="w-full gap-0 overflow-hidden p-0 sm:max-w-2xl"
                >
                    <AgendaDetail
                        key={task.id}
                        task={task}
                        people={people}
                        statusOptions={statusOptions}
                    />
                </SheetContent>
            )}
        </Sheet>
    );
}

function AgendaDetail({
    task,
    people,
    statusOptions,
}: {
    task: TaskDetail;
    people: User[];
    statusOptions: StatusOption[];
}) {
    const form = useForm({
        title: task.title,
        description: task.description ?? '',
        scheduled_at: toDateTimeInput(task.scheduled_at),
        status_note: task.status_note ?? '',
        result_notes: task.result_notes ?? '',
        next_action: task.next_action ?? '',
        reference_url: task.reference_url ?? '',
        assignee_ids: task.assignees.map((person) => person.id),
    });
    const commentForm = useForm({ content: '' });
    const [uploading, setUploading] = useState(false);

    const toggleAssignee = (id: number) => {
        if (!task.permissions.update) return;
        form.setData(
            'assignee_ids',
            form.data.assignee_ids.includes(id)
                ? form.data.assignee_ids.filter((userId) => userId !== id)
                : [...form.data.assignee_ids, id],
        );
    };

    const save = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            scheduled_at: data.scheduled_at || null,
            description: data.description || null,
            status_note: data.status_note || null,
            result_notes: data.result_notes || null,
            next_action: data.next_action || null,
            reference_url: data.reference_url || null,
        }));
        form.patch(`/agenda/tasks/${task.id}`, {
            preserveScroll: true,
        });
    };

    const setStatus = (agendaStatus: string) => {
        if (!task.permissions.update || agendaStatus === task.agenda_status)
            return;
        router.patch(
            `/agenda/tasks/${task.id}`,
            { agenda_status: agendaStatus },
            { preserveScroll: true },
        );
    };

    const addComment = (event: FormEvent) => {
        event.preventDefault();
        if (!commentForm.data.content.trim()) return;
        commentForm.post(
            `/projects/${task.project.key}/tasks/${task.task_number}/comments`,
            {
                preserveScroll: true,
                onSuccess: () => commentForm.reset(),
            },
        );
    };

    const upload = (file: File | undefined) => {
        if (!file) return;
        setUploading(true);
        router.post(
            `/projects/${task.project.key}/tasks/${task.task_number}/attachments`,
            { file },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploading(false),
            },
        );
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="border-b px-5 py-4 pr-12">
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span className="bg-muted rounded-md px-2 py-1 font-medium">
                        {task.project.name}
                    </span>
                    <span>{task.reference}</span>
                </div>
                <SheetTitle className="sr-only">{task.title}</SheetTitle>
                <SheetDescription className="sr-only">
                    Detail pekerjaan tim
                </SheetDescription>
            </SheetHeader>
            <div className="sam-scrollbar min-h-0 flex-1 overflow-y-auto">
                <section className="border-b px-5 py-4">
                    <p className="text-muted-foreground mb-2 text-[10px] font-semibold tracking-[0.12em] uppercase">
                        Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                disabled={!task.permissions.update}
                                onClick={() => setStatus(option.value)}
                                className={cn(
                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default',
                                    option.value === task.agenda_status
                                        ? 'border-transparent text-white'
                                        : 'border-border bg-background hover:bg-muted',
                                )}
                                style={
                                    option.value === task.agenda_status
                                        ? { backgroundColor: option.color }
                                        : undefined
                                }
                            >
                                <span
                                    className="size-2 rounded-full"
                                    style={{
                                        backgroundColor:
                                            option.value === task.agenda_status
                                                ? 'currentColor'
                                                : option.color,
                                    }}
                                />
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>
                <form onSubmit={save}>
                    <section className="grid gap-5 border-b px-5 py-5">
                        <div className="grid gap-2">
                            <Label htmlFor="detail-title">Pekerjaan</Label>
                            <Input
                                id="detail-title"
                                disabled={!task.permissions.update}
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                className="h-11 text-base font-semibold"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="detail-schedule">
                                Jadwal{' '}
                                <span className="text-muted-foreground">
                                    (opsional)
                                </span>
                            </Label>
                            <Input
                                id="detail-schedule"
                                disabled={!task.permissions.update}
                                type="datetime-local"
                                value={form.data.scheduled_at}
                                onChange={(event) =>
                                    form.setData(
                                        'scheduled_at',
                                        event.target.value,
                                    )
                                }
                                className="max-w-xs"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Ditugaskan kepada</Label>
                            <div className="flex flex-wrap gap-2">
                                {people.map((person) => {
                                    const selected =
                                        form.data.assignee_ids.includes(
                                            person.id,
                                        );
                                    return (
                                        <button
                                            key={person.id}
                                            type="button"
                                            disabled={!task.permissions.update}
                                            onClick={() =>
                                                toggleAssignee(person.id)
                                            }
                                            className={cn(
                                                'flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs transition-colors disabled:cursor-default',
                                                selected
                                                    ? 'border-primary/40 bg-primary/10'
                                                    : 'border-border text-muted-foreground',
                                            )}
                                        >
                                            <UserAvatar
                                                user={person}
                                                className="size-5"
                                            />
                                            {person.name}
                                            {selected && (
                                                <Check className="size-3" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                    <section className="grid gap-5 border-b px-5 py-5">
                        <DetailTextarea
                            id="detail-status-note"
                            label="Keterangan status"
                            hint="Apa kondisi terakhirnya?"
                            placeholder="Contoh: Menunggu konfirmasi jadwal dari area RO…"
                            value={form.data.status_note}
                            disabled={!task.permissions.update}
                            onChange={(value) =>
                                form.setData('status_note', value)
                            }
                            rows={3}
                        />
                        <DetailTextarea
                            id="detail-instruction"
                            label="Arahan / konteks"
                            hint="Apa yang perlu dilakukan?"
                            placeholder="Lokasi, kebutuhan, dan arahan pekerjaan…"
                            value={form.data.description}
                            disabled={!task.permissions.update}
                            onChange={(value) =>
                                form.setData('description', value)
                            }
                            rows={4}
                        />
                        <DetailTextarea
                            id="detail-result"
                            label="Hasil kegiatan"
                            hint="Bisa tempel rekap lengkap dari WhatsApp."
                            placeholder={
                                'Contoh:\nGT Halim 2 — Gardu 10\n- FO spare\n- Serial COM perlu tambah PCCOM 4\n- Power ada'
                            }
                            value={form.data.result_notes}
                            disabled={!task.permissions.update}
                            onChange={(value) =>
                                form.setData('result_notes', value)
                            }
                            rows={9}
                        />
                        <DetailTextarea
                            id="detail-next"
                            label="Tindak lanjut"
                            hint="Apa langkah berikutnya?"
                            placeholder="Contoh: Koordinasi splicing ulang dengan IT OPS…"
                            value={form.data.next_action}
                            disabled={!task.permissions.update}
                            onChange={(value) =>
                                form.setData('next_action', value)
                            }
                            rows={4}
                        />
                        <div className="grid gap-2">
                            <Label htmlFor="detail-link">
                                Tautan dokumen / SharePoint
                            </Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Link2 className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        id="detail-link"
                                        disabled={!task.permissions.update}
                                        type="url"
                                        value={form.data.reference_url}
                                        onChange={(event) =>
                                            form.setData(
                                                'reference_url',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="https://…"
                                        className="pl-9"
                                    />
                                </div>
                                {task.reference_url && (
                                    <Button
                                        asChild
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                    >
                                        <a
                                            href={task.reference_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label="Buka tautan"
                                        >
                                            <ExternalLink className="size-4" />
                                        </a>
                                    </Button>
                                )}
                            </div>
                            {form.errors.reference_url && (
                                <p className="text-destructive text-xs">
                                    {form.errors.reference_url}
                                </p>
                            )}
                        </div>
                        {task.permissions.update && (
                            <div className="sticky bottom-3 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={form.processing || !form.isDirty}
                                    className="shadow-lg"
                                >
                                    {form.processing && <Spinner />}
                                    Simpan perubahan
                                </Button>
                            </div>
                        )}
                    </section>
                </form>
                <section className="border-b px-5 py-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-semibold">
                                <Paperclip className="size-4" />
                                Lampiran
                            </h3>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Berita acara, foto, PDF, atau dokumen pendukung.
                            </p>
                        </div>
                        {task.permissions.attach && (
                            <label className="border-input hover:bg-muted inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium">
                                {uploading ? (
                                    <Spinner />
                                ) : (
                                    <Plus className="size-3.5" />
                                )}
                                Unggah
                                <input
                                    type="file"
                                    className="sr-only"
                                    disabled={uploading}
                                    onChange={(event) =>
                                        upload(event.target.files?.[0])
                                    }
                                />
                            </label>
                        )}
                    </div>
                    <div className="grid gap-2">
                        {task.attachments.map((attachment) => (
                            <a
                                key={attachment.id}
                                href={attachment.download_url}
                                className="hover:bg-muted flex items-center gap-3 rounded-lg border px-3 py-2.5"
                            >
                                <FileText className="text-primary size-4 shrink-0" />
                                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                    {attachment.original_name}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                    {Math.max(
                                        1,
                                        Math.round(attachment.file_size / 1024),
                                    )}{' '}
                                    KB
                                </span>
                            </a>
                        ))}
                        {task.attachments.length === 0 && (
                            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-5 text-center text-xs">
                                Belum ada lampiran.
                            </p>
                        )}
                    </div>
                </section>
                <section className="px-5 py-5">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <MessageSquare className="size-4" />
                        Diskusi
                    </h3>
                    {task.permissions.comment && (
                        <form
                            onSubmit={addComment}
                            className="mb-5 flex items-end gap-2"
                        >
                            <textarea
                                value={commentForm.data.content}
                                onChange={(event) =>
                                    commentForm.setData(
                                        'content',
                                        event.target.value,
                                    )
                                }
                                placeholder="Tulis komentar atau pembaruan singkat…"
                                rows={2}
                                className="border-input bg-background min-h-16 flex-1 resize-y rounded-xl border px-3 py-2 text-sm outline-none focus:border-[var(--sam-field-focus)]"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={
                                    commentForm.processing ||
                                    !commentForm.data.content.trim()
                                }
                                aria-label="Kirim komentar"
                            >
                                {commentForm.processing ? (
                                    <Spinner />
                                ) : (
                                    <Send className="size-4" />
                                )}
                            </Button>
                        </form>
                    )}
                    <div className="grid gap-4">
                        {task.comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="flex items-start gap-3"
                            >
                                <UserAvatar
                                    user={comment.author}
                                    className="size-7 shrink-0"
                                />
                                <div className="bg-muted/60 min-w-0 flex-1 rounded-xl px-3 py-2.5">
                                    <p className="text-xs font-semibold">
                                        {comment.author.name}
                                    </p>
                                    <p className="mt-1 text-sm leading-5 whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {task.comments.length === 0 && (
                            <p className="text-muted-foreground text-xs">
                                Belum ada komentar.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function DetailTextarea({
    id,
    label,
    hint,
    placeholder,
    value,
    disabled,
    rows,
    onChange,
}: {
    id: string;
    label: string;
    hint: string;
    placeholder: string;
    value: string;
    disabled: boolean;
    rows: number;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <div>
                <Label htmlFor={id}>{label}</Label>
                <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
            </div>
            <textarea
                id={id}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="border-input bg-background placeholder:text-muted-foreground resize-y rounded-xl border px-3 py-2.5 text-sm leading-6 outline-none focus:border-[var(--sam-field-focus)] disabled:border-transparent disabled:px-0"
            />
        </div>
    );
}

export default function Home({
    tasks,
    filters,
    areas,
    people,
    stats,
    selectedTask,
    statusOptions,
    canCreate,
}: {
    tasks: Paginated<Task>;
    filters: Filters;
    areas: Area[];
    people: User[];
    stats: Stats;
    selectedTask: TaskDetail | null;
    statusOptions: StatusOption[];
    canCreate: boolean;
}) {
    const { auth } = usePage().props;
    const pageUrl = usePage().url;
    const [createOpen, setCreateOpen] = useState(pageUrl.includes('buat=1'));
    const [search, setSearch] = useState(filters.search ?? '');

    useEffect(() => {
        if (pageUrl.includes('buat=1')) setCreateOpen(true);
    }, [pageUrl]);

    const navigate = (changes: Partial<Filters>) => {
        const next = { ...cleanFilters(filters), ...changes };
        router.get('/home', next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        navigate({ search: search.trim() || undefined });
    };

    const openTask = (task: Task) => {
        router.get(
            '/home',
            { ...cleanFilters(filters), task: task.id },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const closeTask = () => navigate({ task: undefined });

    const closeCreate = () => {
        setCreateOpen(false);
        if (pageUrl.includes('buat=1')) {
            router.get('/home', cleanFilters(filters), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    };

    return (
        <>
            <Head title="Agenda Tim" />
            <div className="sam-scrollbar min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-primary text-xs font-semibold tracking-[0.12em] uppercase">
                                Agenda tim
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
                                Apa yang sedang dikerjakan?
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {stats.open} pekerjaan aktif
                                {stats.unassigned > 0 &&
                                    ` · ${stats.unassigned} belum ditugaskan`}
                            </p>
                        </div>
                        <Button
                            onClick={() => setCreateOpen(true)}
                            disabled={!canCreate}
                            className="rounded-full px-5"
                        >
                            <Plus className="size-4" />
                            Tambah pekerjaan
                        </Button>
                    </div>

                    <div className="bg-card border-border/70 overflow-hidden rounded-2xl border shadow-sm">
                        <div className="border-b px-3 pt-3 md:px-5">
                            <div className="sam-scrollbar flex gap-1 overflow-x-auto">
                                {viewItems.map((item) => {
                                    const count =
                                        item.value === 'all'
                                            ? stats.open
                                            : item.value === 'mine'
                                              ? stats.mine
                                              : item.value === 'today'
                                                ? stats.today
                                                : item.value === 'waiting'
                                                  ? stats.waiting
                                                  : null;
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() =>
                                                navigate({
                                                    view: item.value,
                                                })
                                            }
                                            className={cn(
                                                'relative flex h-10 shrink-0 items-center gap-2 px-3 text-sm font-medium',
                                                filters.view === item.value
                                                    ? 'text-primary after:bg-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {item.label}
                                            {count !== null && count > 0 && (
                                                <span className="bg-muted rounded-full px-1.5 text-[10px]">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 border-b p-3 md:px-5">
                            <form
                                onSubmit={submitSearch}
                                className="relative min-w-[220px] flex-1 md:max-w-sm"
                            >
                                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Cari pekerjaan…"
                                    className="h-9 pl-9 shadow-none"
                                />
                            </form>
                            <select
                                value={filters.area ?? ''}
                                onChange={(event) =>
                                    navigate({
                                        area: event.target.value
                                            ? Number(event.target.value)
                                            : undefined,
                                    })
                                }
                                className="border-input bg-background h-9 max-w-[210px] rounded-md border px-3 text-xs outline-none focus:border-[var(--sam-field-focus)]"
                            >
                                <option value="">Semua area</option>
                                {areas.map((area) => (
                                    <option key={area.id} value={area.id}>
                                        {area.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filters.person ?? ''}
                                onChange={(event) =>
                                    navigate({
                                        person: event.target.value
                                            ? Number(event.target.value)
                                            : undefined,
                                    })
                                }
                                className="border-input bg-background h-9 max-w-[190px] rounded-md border px-3 text-xs outline-none focus:border-[var(--sam-field-focus)]"
                            >
                                <option value="">Semua orang</option>
                                {people.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {person.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {tasks.data.length > 0 ? (
                            <>
                                <div className="bg-muted/50 text-muted-foreground hidden h-9 grid-cols-[minmax(250px,1fr)_155px_170px_135px_130px] items-center px-5 text-[10px] font-semibold tracking-[0.1em] uppercase md:grid">
                                    <span>
                                        Pekerjaan &amp; catatan terakhir
                                    </span>
                                    <span>Area</span>
                                    <span>Ditugaskan kepada</span>
                                    <span>Jadwal</span>
                                    <span>Status</span>
                                </div>
                                {tasks.data.map((task) => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        onClick={() => openTask(task)}
                                    />
                                ))}
                                <Pagination links={tasks.links} />
                            </>
                        ) : (
                            <div className="px-6 py-16 text-center">
                                {filters.view === 'done' ? (
                                    <CheckCircle2 className="text-muted-foreground mx-auto size-9" />
                                ) : (
                                    <UsersRound className="text-muted-foreground mx-auto size-9" />
                                )}
                                <h2 className="mt-4 font-semibold">
                                    Belum ada pekerjaan di tampilan ini
                                </h2>
                                <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
                                    {areas.length === 0
                                        ? 'Buat satu area pekerjaan terlebih dahulu, misalnya Umum, RFID, Audit, atau Compliance.'
                                        : 'Tambahkan pekerjaan baru atau ubah filter untuk melihat agenda lainnya.'}
                                </p>
                                <div className="mt-5 flex justify-center gap-2">
                                    {areas.length === 0 &&
                                        auth.user?.role === 'admin' && (
                                            <Button asChild variant="outline">
                                                <Link href="/projects?create=1">
                                                    Buat area pekerjaan
                                                </Link>
                                            </Button>
                                        )}
                                    {areas.length > 0 && (
                                        <Button
                                            onClick={() => setCreateOpen(true)}
                                        >
                                            <Plus className="size-4" />
                                            Tambah pekerjaan
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-xs">
                        <Clock3 className="size-3.5" />
                        Klik pekerjaan untuk memperbarui hasil dan tindak
                        lanjut.
                    </p>
                </div>
            </div>
            <CreateAgendaDialog
                open={createOpen}
                onOpenChange={(open) =>
                    open ? setCreateOpen(true) : closeCreate()
                }
                areas={areas}
                people={people}
            />
            <TaskDetailSheet
                task={selectedTask}
                people={people}
                statusOptions={statusOptions}
                onClose={closeTask}
            />
        </>
    );
}
