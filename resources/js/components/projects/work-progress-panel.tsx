import { router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    Plus,
    Trash2,
    UserRound,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { UserAvatar } from '@/components/app/user-avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, relativeTime } from '@/lib/format';
import type { ProgressItem, Project, User } from '@/types';

export function WorkProgressPanel({
    project,
    items,
    members,
    canEdit,
}: {
    project: Project;
    items: ProgressItem[];
    members: User[];
    canEdit: boolean;
}) {
    const notes = useForm({
        blockers: project.blockers ?? '',
        next_steps: project.next_steps ?? '',
    });
    const saveNotes = (event: FormEvent) => {
        event.preventDefault();
        notes.patch(`/projects/${project.key}`, { preserveScroll: true });
    };
    const unit =
        project.progress_mode === 'numeric'
            ? (project.progress_unit ?? 'item')
            : 'tugas';

    return (
        <section className="from-primary/[0.04] border-b bg-gradient-to-b to-transparent p-4 md:p-6">
            <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
                <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
                    <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium">
                                    PROGRES PEKERJAAN
                                </p>
                                <div className="mt-2 flex items-end gap-2">
                                    <strong className="text-3xl font-semibold tracking-tight">
                                        {project.progress.completed.toLocaleString(
                                            'id-ID',
                                        )}
                                    </strong>
                                    <span className="text-muted-foreground pb-1 text-sm">
                                        /{' '}
                                        {project.progress.total.toLocaleString(
                                            'id-ID',
                                        )}{' '}
                                        {unit}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-primary/10 text-primary rounded-xl px-4 py-2 text-xl font-semibold">
                                {project.progress.percent}%
                            </div>
                        </div>
                        <Progress
                            value={project.progress.percent}
                            className="mt-4 h-2.5"
                        />
                        <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                            <span className="inline-flex items-center gap-1.5">
                                <UserRound className="size-3.5" /> PIC utama:{' '}
                                {project.owner.name}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-3.5" /> Tenggat:{' '}
                                {formatDate(project.due_date)}
                            </span>
                            <span>
                                Update terakhir:{' '}
                                {project.last_progress_update_at
                                    ? relativeTime(
                                          project.last_progress_update_at,
                                      )
                                    : 'belum ada'}
                            </span>
                        </div>
                    </div>

                    {project.progress_mode === 'numeric' && (
                        <div className="border-t">
                            <div className="flex items-center justify-between gap-3 px-5 py-3">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Rekap per cakupan / ruas
                                    </h2>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        Perbarui realisasi agar progres
                                        keseluruhan ikut berubah.
                                    </p>
                                </div>
                                {canEdit && (
                                    <AddProgressItem
                                        project={project}
                                        members={members}
                                    />
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <div className="min-w-[720px]">
                                    <div className="bg-muted/60 text-muted-foreground grid grid-cols-[minmax(200px,1fr)_150px_130px_110px_40px] px-4 py-2 text-[10px] font-semibold tracking-wider uppercase">
                                        <span>Cakupan / ruas</span>
                                        <span>PIC</span>
                                        <span>Realisasi</span>
                                        <span>Progres</span>
                                        <span />
                                    </div>
                                    {items.map((item) => (
                                        <ProgressItemRow
                                            key={item.id}
                                            project={project}
                                            item={item}
                                            canEdit={canEdit}
                                        />
                                    ))}
                                    {items.length === 0 && (
                                        <div className="text-muted-foreground px-5 py-8 text-center text-sm">
                                            Belum ada cakupan. Tambahkan ruas,
                                            lokasi, atau kelompok target
                                            pertama.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <form
                    onSubmit={saveNotes}
                    className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm"
                >
                    <h2 className="text-sm font-semibold">
                        Catatan untuk monitoring
                    </h2>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Ringkasan ini nantinya menjadi bahan laporan manajer.
                    </p>
                    <label className="mt-4 grid gap-1.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <AlertTriangle className="size-3.5 text-amber-500" />{' '}
                            Kendala
                        </span>
                        <textarea
                            disabled={!canEdit}
                            value={notes.data.blockers}
                            onChange={(event) =>
                                notes.setData('blockers', event.target.value)
                            }
                            className="bg-background min-h-20 rounded-xl border px-3 py-2 text-sm disabled:opacity-75"
                            placeholder="Belum ada kendala."
                        />
                    </label>
                    <label className="mt-3 grid gap-1.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <ArrowRight className="size-3.5 text-blue-500" />{' '}
                            Rencana berikutnya
                        </span>
                        <textarea
                            disabled={!canEdit}
                            value={notes.data.next_steps}
                            onChange={(event) =>
                                notes.setData('next_steps', event.target.value)
                            }
                            className="bg-background min-h-20 rounded-xl border px-3 py-2 text-sm disabled:opacity-75"
                            placeholder="Tuliskan langkah berikutnya."
                        />
                    </label>
                    {canEdit && (
                        <Button
                            type="submit"
                            size="sm"
                            className="mt-4 w-full"
                            disabled={notes.processing}
                        >
                            {notes.processing && <Spinner />} Simpan catatan
                        </Button>
                    )}
                </form>
            </div>
        </section>
    );
}

function ProgressItemRow({
    project,
    item,
    canEdit,
}: {
    project: Project;
    item: ProgressItem;
    canEdit: boolean;
}) {
    const [completed, setCompleted] = useState(String(item.completed_value));
    const save = () => {
        const value = Math.max(
            0,
            Math.min(Number(completed) || 0, item.target_value),
        );
        setCompleted(String(value));
        if (value !== item.completed_value) {
            router.patch(
                `/projects/${project.key}/progress-items/${item.id}`,
                { completed_value: value },
                { preserveScroll: true },
            );
        }
    };

    return (
        <div className="grid min-h-14 grid-cols-[minmax(200px,1fr)_150px_130px_110px_40px] items-center border-t px-4 text-xs">
            <div className="min-w-0 pr-3">
                <p className="truncate font-medium">{item.name}</p>
                {item.notes && (
                    <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                        {item.notes}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2">
                {item.assignee ? (
                    <>
                        <UserAvatar user={item.assignee} className="size-6" />
                        <span className="truncate">{item.assignee.name}</span>
                    </>
                ) : (
                    <span className="text-muted-foreground">Belum ada</span>
                )}
            </div>
            <div className="flex items-center gap-1">
                {canEdit ? (
                    <Input
                        className="h-8 w-16 px-2"
                        type="number"
                        min="0"
                        max={item.target_value}
                        value={completed}
                        onChange={(event) => setCompleted(event.target.value)}
                        onBlur={save}
                        onKeyDown={(event) =>
                            event.key === 'Enter' && event.currentTarget.blur()
                        }
                    />
                ) : (
                    <strong>{item.completed_value}</strong>
                )}
                <span className="text-muted-foreground">
                    / {item.target_value}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <Progress value={item.percent} className="w-14" />
                <span>{item.percent}%</span>
            </div>
            {canEdit && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    onClick={() => {
                        if (window.confirm(`Hapus cakupan ${item.name}?`))
                            router.delete(
                                `/projects/${project.key}/progress-items/${item.id}`,
                                { preserveScroll: true },
                            );
                    }}
                    aria-label={`Hapus ${item.name}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            )}
        </div>
    );
}

function AddProgressItem({
    project,
    members,
}: {
    project: Project;
    members: User[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        assignee_id: '',
        target_value: '',
        completed_value: '0',
        notes: '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            assignee_id: data.assignee_id ? Number(data.assignee_id) : null,
            target_value: Number(data.target_value),
            completed_value: Number(data.completed_value),
        }));
        form.post(`/projects/${project.key}/progress-items`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="size-3.5" /> Tambah cakupan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tambah cakupan progres</DialogTitle>
                    <DialogDescription>
                        Gunakan nama ruas, lokasi, kelompok, atau hasil kerja
                        yang bisa diukur.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <Field label="Cakupan / ruas" error={form.errors.name}>
                        <Input
                            autoFocus
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Ruas Jagorawi"
                        />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field
                            label={`Target (${project.progress_unit ?? 'item'})`}
                            error={form.errors.target_value}
                        >
                            <Input
                                type="number"
                                min="1"
                                value={form.data.target_value}
                                onChange={(event) =>
                                    form.setData(
                                        'target_value',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            label="Realisasi awal"
                            error={form.errors.completed_value}
                        >
                            <Input
                                type="number"
                                min="0"
                                value={form.data.completed_value}
                                onChange={(event) =>
                                    form.setData(
                                        'completed_value',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                    </div>
                    <Field label="PIC" error={form.errors.assignee_id}>
                        <Select
                            value={form.data.assignee_id || 'none'}
                            onValueChange={(value) =>
                                form.setData(
                                    'assignee_id',
                                    value === 'none' ? '' : value,
                                )
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    Belum ditentukan
                                </SelectItem>
                                {members.map((member) => (
                                    <SelectItem
                                        key={member.id}
                                        value={String(member.id)}
                                    >
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Catatan singkat" error={form.errors.notes}>
                        <Input
                            value={form.data.notes}
                            onChange={(event) =>
                                form.setData('notes', event.target.value)
                            }
                            placeholder="Opsional"
                        />
                    </Field>
                    <Button
                        type="submit"
                        disabled={
                            form.processing ||
                            !form.data.name.trim() ||
                            !form.data.target_value
                        }
                    >
                        {form.processing && <Spinner />} Tambahkan
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-1.5">
            <Label>{label}</Label>
            {children}
            {error && <span className="text-destructive text-xs">{error}</span>}
        </label>
    );
}
