import { Head, router, useForm } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Plus, Trash2, UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { UserAvatar } from '@/components/app/user-avatar';
import { ProjectPage } from '@/components/projects/project-page';
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
import { Label as FieldLabel } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Label, Option, Project, User, WorkflowStatus } from '@/types';

type Props = {
    project: Project;
    statuses: WorkflowStatus[];
    labels: Label[];
    availableUsers: User[];
    projectStatuses: Option[];
    projectHealth: Option[];
    memberRoles: Option[];
    statusCategories: Option[];
    permissions: {
        manageMembers: boolean;
        manageWorkflow: boolean;
        archiveProject: boolean;
        deleteProject: boolean;
    };
};

const tabs = ['Umum', 'Anggota', 'Alur Kerja', 'Label'] as const;
type Tab = (typeof tabs)[number];

export default function ProjectSettings(props: Props) {
    const [tab, setTab] = useState<Tab>('Umum');
    return (
        <>
            <Head title={`${props.project.key} Pengaturan`} />
            <ProjectPage project={props.project}>
                <div className="sam-scrollbar h-full overflow-y-auto p-4 md:p-6">
                    <div className="bg-card border-border/60 mx-auto max-w-4xl overflow-hidden rounded-2xl border shadow-sm">
                        <div className="border-b px-5 pt-4">
                            <h2 className="text-base font-semibold">
                                Pengaturan proyek
                            </h2>
                            <nav className="mt-3 flex gap-1">
                                {tabs.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setTab(item)}
                                        className={cn(
                                            'text-muted-foreground relative h-9 px-3 text-xs font-medium',
                                            tab === item &&
                                                'text-primary after:bg-primary after:absolute after:inset-x-1 after:bottom-0 after:h-0.5',
                                        )}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        {tab === 'Umum' && <GeneralSettings {...props} />}
                        {tab === 'Anggota' && <MemberSettings {...props} />}
                        {tab === 'Alur Kerja' && (
                            <WorkflowSettings {...props} />
                        )}
                        {tab === 'Label' && <LabelSettings {...props} />}
                    </div>
                </div>
            </ProjectPage>
        </>
    );
}

function GeneralSettings({
    project,
    availableUsers,
    projectStatuses,
    projectHealth,
    permissions,
}: Props) {
    const form = useForm({
        name: project.name,
        key: project.key,
        description: project.description ?? '',
        owner_id: String(project.owner.id),
        status: project.status,
        health: project.health,
        start_date: project.start_date ?? '',
        due_date: project.due_date ?? '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            owner_id: Number(data.owner_id),
            start_date: data.start_date || null,
            due_date: data.due_date || null,
        }));
        form.patch(`/projects/${project.key}`);
    };
    return (
        <form onSubmit={submit} className="grid gap-5 p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <Field label="Nama proyek" error={form.errors.name}>
                    <Input
                        value={form.data.name}
                        onChange={(event) =>
                            form.setData('name', event.target.value)
                        }
                    />
                </Field>
                <Field label="Kode proyek" error={form.errors.key}>
                    <Input
                        className="font-mono uppercase"
                        value={form.data.key}
                        onChange={(event) =>
                            form.setData(
                                'key',
                                event.target.value
                                    .toUpperCase()
                                    .replace(/[^A-Z0-9]/g, ''),
                            )
                        }
                    />
                </Field>
            </div>
            <Field label="Deskripsi" error={form.errors.description}>
                <textarea
                    className="bg-background min-h-28 rounded-md border px-3 py-2 text-sm"
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Pemilik proyek" error={form.errors.owner_id}>
                    <Select
                        value={form.data.owner_id}
                        onValueChange={(value) =>
                            form.setData('owner_id', value)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableUsers.map((user) => (
                                <SelectItem
                                    key={user.id}
                                    value={String(user.id)}
                                >
                                    {user.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Status proyek" error={form.errors.status}>
                    <Select
                        value={form.data.status}
                        onValueChange={(value) =>
                            form.setData(
                                'status',
                                value as typeof form.data.status,
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {projectStatuses.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
                <Field label="Kondisi" error={form.errors.health}>
                    <Select
                        value={form.data.health}
                        onValueChange={(value) =>
                            form.setData(
                                'health',
                                value as typeof form.data.health,
                            )
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {projectHealth.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tanggal mulai" error={form.errors.start_date}>
                    <Input
                        type="date"
                        value={form.data.start_date}
                        onChange={(event) =>
                            form.setData('start_date', event.target.value)
                        }
                    />
                </Field>
                <Field label="Tenggat" error={form.errors.due_date}>
                    <Input
                        type="date"
                        value={form.data.due_date}
                        onChange={(event) =>
                            form.setData('due_date', event.target.value)
                        }
                    />
                </Field>
            </div>
            <div className="flex items-center justify-between gap-3 border-t pt-4">
                <div className="flex items-center gap-1">
                    {permissions.archiveProject && (
                        <ArchiveProject project={project} />
                    )}
                    {permissions.deleteProject && (
                        <DeleteProject project={project} />
                    )}
                </div>
                <Button type="submit" size="sm" disabled={form.processing}>
                    {form.processing && <Spinner />}Simpan perubahan
                </Button>
            </div>
        </form>
    );
}

function MemberSettings({
    project,
    availableUsers,
    memberRoles,
    permissions,
}: Props) {
    const members = project.members ?? [];
    const candidates = availableUsers.filter(
        (user) => !members.some((member) => member.id === user.id),
    );
    const form = useForm({
        user_id: String(candidates[0]?.id ?? ''),
        role: 'member',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            user_id: Number(data.user_id),
            role: data.role,
        }));
        form.post(`/projects/${project.key}/members`, { preserveScroll: true });
    };
    return (
        <div className="p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold">Anggota proyek</h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                        Atur akses proyek tanpa mengubah peran pengguna secara
                        global.
                    </p>
                </div>
                {permissions.manageMembers && candidates.length > 0 && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8">
                                <UserPlus className="size-3.5" />
                                Tambah anggota
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Tambah anggota proyek</DialogTitle>
                                <DialogDescription>
                                    Pilih pegawai aktif dan perannya di proyek.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={submit} className="grid gap-4">
                                <Field label="Pegawai">
                                    <Select
                                        value={form.data.user_id}
                                        onValueChange={(value) =>
                                            form.setData('user_id', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {candidates.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={String(user.id)}
                                                >
                                                    {user.name} · {user.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Field label="Peran proyek">
                                    <Select
                                        value={form.data.role}
                                        onValueChange={(value) =>
                                            form.setData('role', value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {memberRoles.map((role) => (
                                                <SelectItem
                                                    key={role.value}
                                                    value={role.value}
                                                >
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={
                                        form.processing || !form.data.user_id
                                    }
                                >
                                    {form.processing && <Spinner />}Tambah
                                    anggota
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <div className="border-border/60 mt-5 overflow-hidden rounded-2xl border shadow-sm">
                <div className="bg-muted/70 text-muted-foreground grid h-8 grid-cols-[minmax(240px,1fr)_150px_50px] items-center px-3 text-[10px] font-semibold tracking-wide uppercase">
                    <span>Pengguna</span>
                    <span>Peran proyek</span>
                    <span />
                </div>
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="grid min-h-12 grid-cols-[minmax(240px,1fr)_150px_50px] items-center border-t px-3"
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <UserAvatar user={member} />
                            <span className="min-w-0">
                                <span className="block truncate text-xs font-medium">
                                    {member.name}
                                </span>
                                <span className="text-muted-foreground block truncate text-[10px]">
                                    {member.email}
                                </span>
                            </span>
                        </div>
                        {member.project_role === 'owner' ? (
                            <span className="text-xs font-medium">Pemilik</span>
                        ) : (
                            <Select
                                disabled={!permissions.manageMembers}
                                value={member.project_role}
                                onValueChange={(role) =>
                                    router.post(
                                        `/projects/${project.key}/members`,
                                        { user_id: member.id, role },
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <SelectTrigger size="sm" className="h-7 w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {memberRoles.map((role) => (
                                        <SelectItem
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <div>
                            {permissions.manageMembers &&
                                member.project_role !== 'owner' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive size-7"
                                        onClick={() =>
                                            router.delete(
                                                `/projects/${project.key}/members/${member.id}`,
                                                { preserveScroll: true },
                                            )
                                        }
                                        aria-label={`Hapus ${member.name}`}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function WorkflowSettings({
    project,
    statuses,
    statusCategories,
    permissions,
}: Props) {
    const form = useForm({ name: '', color: '#64748b', category: 'todo' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/projects/${project.key}/workflow/statuses`, {
            preserveScroll: true,
            onSuccess: () => form.reset('name'),
        });
    };
    const move = (index: number, change: number) => {
        const target = index + change;
        if (target < 0 || target >= statuses.length) return;
        const ids = statuses.map((status) => status.id);
        [ids[index], ids[target]] = [ids[target], ids[index]];
        router.patch(
            `/projects/${project.key}/workflow/statuses/reorder`,
            { ordered_ids: ids },
            { preserveScroll: true },
        );
    };
    return (
        <div className="p-5">
            <div>
                <h3 className="text-sm font-semibold">Alur kerja tugas</h3>
                <p className="text-muted-foreground mt-1 text-xs">
                    Kategori status menentukan progres dan penyelesaian tanpa
                    bergantung pada nama status.
                </p>
            </div>
            <div className="border-border/60 mt-5 overflow-hidden rounded-2xl border shadow-sm">
                {statuses.map((status, index) => (
                    <StatusRow
                        key={status.id}
                        project={project}
                        status={status}
                        statuses={statuses}
                        categories={statusCategories}
                        canManage={permissions.manageWorkflow}
                        moveUp={() => move(index, -1)}
                        moveDown={() => move(index, 1)}
                        first={index === 0}
                        last={index === statuses.length - 1}
                    />
                ))}
            </div>
            {permissions.manageWorkflow && (
                <form
                    onSubmit={submit}
                    className="bg-muted/20 mt-4 grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_82px_150px_auto]"
                >
                    <Field label="Status baru" error={form.errors.name}>
                        <Input
                            className="h-8"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData(
                                    'name',
                                    event.target.value.toUpperCase(),
                                )
                            }
                            placeholder="READY FOR RELEASE"
                        />
                    </Field>
                    <Field label="Warna">
                        <Input
                            className="h-8 p-1"
                            type="color"
                            value={form.data.color}
                            onChange={(event) =>
                                form.setData('color', event.target.value)
                            }
                        />
                    </Field>
                    <Field label="Kategori">
                        <Select
                            value={form.data.category}
                            onValueChange={(value) =>
                                form.setData('category', value)
                            }
                        >
                            <SelectTrigger size="sm" className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusCategories.map((category) => (
                                    <SelectItem
                                        key={category.value}
                                        value={category.value}
                                    >
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Button
                        size="sm"
                        className="h-8"
                        disabled={form.processing || !form.data.name.trim()}
                    >
                        {form.processing ? (
                            <Spinner />
                        ) : (
                            <Plus className="size-3.5" />
                        )}
                        Tambah
                    </Button>
                </form>
            )}
        </div>
    );
}

function StatusRow({
    project,
    status,
    statuses,
    categories,
    canManage,
    moveUp,
    moveDown,
    first,
    last,
}: {
    project: Project;
    status: WorkflowStatus;
    statuses: WorkflowStatus[];
    categories: Option[];
    canManage: boolean;
    moveUp: () => void;
    moveDown: () => void;
    first: boolean;
    last: boolean;
}) {
    const [name, setName] = useState(status.name);
    const [color, setColor] = useState(status.color);
    const [category, setCategory] = useState(status.category);
    const save = () =>
        router.patch(
            `/projects/${project.key}/workflow/statuses/${status.id}`,
            { name, color, category },
            { preserveScroll: true },
        );
    return (
        <div className="grid min-h-12 grid-cols-[52px_minmax(180px,1fr)_150px_80px_40px] items-center border-t px-2 first:border-t-0">
            <div className="flex">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={!canManage || first}
                    onClick={moveUp}
                >
                    <ArrowUp className="size-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    disabled={!canManage || last}
                    onClick={moveDown}
                >
                    <ArrowDown className="size-3" />
                </Button>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    disabled={!canManage}
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="size-5 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <Input
                    disabled={!canManage}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    onBlur={save}
                    className="hover:border-input h-7 border-transparent bg-transparent px-1.5 text-xs font-medium shadow-none"
                />
            </div>
            <Select
                disabled={!canManage}
                value={category}
                onValueChange={(value) => {
                    setCategory(value as typeof category);
                    router.patch(
                        `/projects/${project.key}/workflow/statuses/${status.id}`,
                        { name, color, category: value },
                        { preserveScroll: true },
                    );
                }}
            >
                <SelectTrigger size="sm" className="h-7 w-32">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {categories.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span className="text-muted-foreground text-right text-[11px]">
                {status.task_count ?? 0} tugas
            </span>
            <div className="text-right">
                {canManage && statuses.length > 1 && (
                    <DeleteStatus
                        project={project}
                        status={status}
                        statuses={statuses}
                    />
                )}
            </div>
        </div>
    );
}

function DeleteStatus({
    project,
    status,
    statuses,
}: {
    project: Project;
    status: WorkflowStatus;
    statuses: WorkflowStatus[];
}) {
    const [replacement, setReplacement] = useState(
        String(statuses.find((item) => item.id !== status.id)?.id ?? ''),
    );
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-7"
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Hapus {status.name}?</DialogTitle>
                    <DialogDescription>
                        {(status.task_count ?? 0) > 0
                            ? `Pindahkan ${status.task_count} tugas ke status lain sebelum dihapus.`
                            : 'Status ini kosong dan dapat dihapus.'}
                    </DialogDescription>
                </DialogHeader>
                {(status.task_count ?? 0) > 0 && (
                    <Field label="Status pengganti">
                        <Select
                            value={replacement}
                            onValueChange={setReplacement}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statuses
                                    .filter((item) => item.id !== status.id)
                                    .map((item) => (
                                        <SelectItem
                                            key={item.id}
                                            value={String(item.id)}
                                        >
                                            {item.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                        router.delete(
                            `/projects/${project.key}/workflow/statuses/${status.id}`,
                            {
                                data: {
                                    replacement_status_id: replacement
                                        ? Number(replacement)
                                        : null,
                                },
                                preserveScroll: true,
                            },
                        )
                    }
                >
                    Hapus status
                </Button>
            </DialogContent>
        </Dialog>
    );
}

function LabelSettings({ project, labels, permissions }: Props) {
    const form = useForm({ name: '', color: '#2563eb' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(`/projects/${project.key}/labels`, {
            preserveScroll: true,
            onSuccess: () => form.reset('name'),
        });
    };
    return (
        <div className="p-5">
            <h3 className="text-sm font-semibold">Label proyek</h3>
            <p className="text-muted-foreground mt-1 text-xs">
                Gunakan label yang singkat dan konsisten untuk menyaring tugas.
            </p>
            <div className="border-border/60 mt-5 overflow-hidden rounded-2xl border shadow-sm">
                {labels.map((label) => (
                    <LabelRow
                        key={label.id}
                        project={project}
                        label={label}
                        canManage={permissions.manageWorkflow}
                    />
                ))}
                {labels.length === 0 && (
                    <p className="text-muted-foreground px-4 py-8 text-center text-xs">
                        Belum ada label.
                    </p>
                )}
            </div>
            {permissions.manageWorkflow && (
                <form
                    onSubmit={submit}
                    className="bg-muted/20 mt-4 flex items-end gap-3 rounded-md border p-3"
                >
                    <Field label="Label baru" error={form.errors.name}>
                        <Input
                            className="h-8"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Security"
                        />
                    </Field>
                    <Field label="Warna">
                        <Input
                            className="h-8 w-20 p-1"
                            type="color"
                            value={form.data.color}
                            onChange={(event) =>
                                form.setData('color', event.target.value)
                            }
                        />
                    </Field>
                    <Button
                        size="sm"
                        className="h-8"
                        disabled={form.processing || !form.data.name.trim()}
                    >
                        <Plus className="size-3.5" />
                        Tambah
                    </Button>
                </form>
            )}
        </div>
    );
}

function LabelRow({
    project,
    label,
    canManage,
}: {
    project: Project;
    label: Label;
    canManage: boolean;
}) {
    const [name, setName] = useState(label.name);
    const [color, setColor] = useState(label.color);
    const save = () =>
        router.patch(
            `/projects/${project.key}/labels/${label.id}`,
            { name, color },
            { preserveScroll: true },
        );
    return (
        <div className="grid min-h-11 grid-cols-[36px_minmax(180px,1fr)_90px_40px] items-center border-t px-3 first:border-t-0">
            <input
                type="color"
                disabled={!canManage}
                value={color}
                onChange={(event) => setColor(event.target.value)}
                onBlur={save}
                className="size-5 rounded border-0 bg-transparent p-0"
            />
            <Input
                disabled={!canManage}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onBlur={save}
                className="hover:border-input h-7 border-transparent bg-transparent px-1.5 text-xs shadow-none"
            />
            <span className="text-muted-foreground text-right text-[11px]">
                {label.task_count ?? 0} tugas
            </span>
            {canManage && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-7"
                    onClick={() =>
                        router.delete(
                            `/projects/${project.key}/labels/${label.id}`,
                            { preserveScroll: true },
                        )
                    }
                >
                    <Trash2 className="size-3.5" />
                </Button>
            )}
        </div>
    );
}

function ArchiveProject({ project }: { project: Project }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive text-xs"
                >
                    Arsipkan proyek
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Arsipkan {project.name}?</DialogTitle>
                    <DialogDescription>
                        Proyek dan seluruh riwayatnya tetap tersimpan, tetapi
                        tidak lagi tampil di navigasi aktif.
                    </DialogDescription>
                </DialogHeader>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => router.delete(`/projects/${project.key}`)}
                >
                    Arsipkan proyek
                </Button>
            </DialogContent>
        </Dialog>
    );
}

function DeleteProject({ project }: { project: Project }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ reason: '', confirmation: '' });

    const destroy = (event: FormEvent) => {
        event.preventDefault();
        form.delete(`/projects/${project.key}/permanent`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs"
                >
                    Hapus proyek
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Hapus permanen {project.name}?</DialogTitle>
                    <DialogDescription>
                        Semua tugas, komentar, workflow, label, attachment, dan
                        riwayat aktivitas proyek akan dihapus. Tindakan ini
                        tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={destroy} className="grid gap-4">
                    <Field
                        label="Alasan penghapusan"
                        error={form.errors.reason}
                    >
                        <textarea
                            value={form.data.reason}
                            onChange={(event) =>
                                form.setData('reason', event.target.value)
                            }
                            rows={4}
                            maxLength={1000}
                            placeholder="Contoh: Proyek dummy untuk pengujian sudah tidak diperlukan."
                            className="border-input bg-background min-h-24 w-full resize-y rounded-xl border px-3 py-2 text-sm"
                            required
                        />
                    </Field>
                    <Field
                        label={`Ketik ${project.key} untuk konfirmasi`}
                        error={form.errors.confirmation}
                    >
                        <Input
                            value={form.data.confirmation}
                            onChange={(event) =>
                                form.setData(
                                    'confirmation',
                                    event.target.value.toUpperCase(),
                                )
                            }
                            placeholder={project.key}
                            autoComplete="off"
                            required
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={form.processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={
                                form.processing ||
                                form.data.confirmation !== project.key
                            }
                        >
                            {form.processing && <Spinner />}
                            Hapus permanen
                        </Button>
                    </div>
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
            <FieldLabel className="text-xs">{label}</FieldLabel>
            {children}
            {error && <span className="text-destructive text-xs">{error}</span>}
        </label>
    );
}
