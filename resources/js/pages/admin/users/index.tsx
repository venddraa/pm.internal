import { Head, router, useForm } from '@inertiajs/react';
import {
    MoreHorizontal,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserRoundX,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/format';
import type { Option, Paginated, User } from '@/types';

type ManagedUser = User & { created_at: string; can_delete: boolean };

type Props = {
    users: Paginated<ManagedUser>;
    filters: Record<string, string | undefined>;
    roles: Option[];
};

export default function AdminUsersIndex({ users, filters, roles }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<ManagedUser | null>(null);
    const [deleting, setDeleting] = useState<ManagedUser | null>(null);
    const navigate = (key: string, value: string) =>
        router.get(
            '/administration/users',
            { ...filters, [key]: value === 'all' ? undefined : value },
            { preserveState: true, replace: true },
        );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        navigate('search', search.trim());
    };

    return (
        <>
            <Head title="Administrasi pengguna" />
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="bg-card flex items-center justify-between gap-4 border-b px-5 py-4">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Pengguna
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            Kelola akses anggota tim tanpa pendaftaran publik.
                        </p>
                    </div>
                    <CreateUserDialog roles={roles} />
                </div>

                <div className="bg-card flex flex-wrap items-center gap-2 border-b px-4 py-2">
                    <form onSubmit={submit} className="relative w-64">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="h-8 pl-8 text-xs shadow-none"
                            placeholder="Cari nama atau email…"
                        />
                    </form>
                    <Select
                        value={filters.role ?? 'all'}
                        onValueChange={(value) => navigate('role', value)}
                    >
                        <SelectTrigger size="sm" className="w-32">
                            <SelectValue placeholder="Peran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua peran</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(value) => navigate('status', value)}
                    >
                        <SelectTrigger size="sm" className="w-32">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua status</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="inactive">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="sam-scrollbar min-h-0 flex-1 overflow-auto p-4">
                    <div className="bg-card border-border/60 min-w-[700px] overflow-hidden rounded-2xl border shadow-sm">
                        <div className="bg-muted/70 text-muted-foreground grid h-8 grid-cols-[minmax(300px,1fr)_130px_120px_130px_40px] items-center px-3 text-[10px] font-semibold tracking-wider uppercase">
                            <span>Pengguna</span>
                            <span>Peran</span>
                            <span>Status</span>
                            <span>Dibuat</span>
                            <span />
                        </div>
                        {users.data.map((user) => (
                            <div
                                key={user.id}
                                className="group hover:bg-muted/35 grid min-h-14 grid-cols-[minmax(300px,1fr)_130px_120px_130px_40px] items-center border-t px-3 text-xs"
                            >
                                <button
                                    type="button"
                                    onClick={() => setEditing(user)}
                                    className="flex min-w-0 items-center gap-2.5 text-left"
                                >
                                    <UserAvatar
                                        user={user}
                                        className="size-8"
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">
                                            {user.name}
                                        </span>
                                        <span className="text-muted-foreground block truncate text-[11px]">
                                            {user.email}
                                        </span>
                                    </span>
                                </button>
                                <span className="flex items-center gap-1.5 font-medium">
                                    <ShieldCheck className="text-muted-foreground size-3.5" />
                                    {roles.find(
                                        (role) => role.value === user.role,
                                    )?.label ?? user.role}
                                </span>
                                <span
                                    className={
                                        user.is_active
                                            ? 'flex w-fit items-center gap-1.5 rounded-sm bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'bg-muted text-muted-foreground flex w-fit items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px]'
                                    }
                                >
                                    <span
                                        className={
                                            user.is_active
                                                ? 'size-1.5 rounded-full bg-emerald-500'
                                                : 'bg-muted-foreground size-1.5 rounded-full'
                                        }
                                    />
                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                                <span className="text-muted-foreground">
                                    {formatDate(user.created_at, {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                                            aria-label={`Tindakan untuk ${user.name}`}
                                        >
                                            <MoreHorizontal className="size-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            onClick={() => setEditing(user)}
                                        >
                                            Edit pengguna
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className={
                                                user.is_active
                                                    ? 'text-destructive'
                                                    : 'text-emerald-700'
                                            }
                                            onClick={() =>
                                                router.patch(
                                                    `/administration/users/${user.id}`,
                                                    {
                                                        is_active:
                                                            !user.is_active,
                                                    },
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            {user.is_active ? (
                                                <>
                                                    <UserRoundX className="size-3.5" />
                                                    Nonaktifkan
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="size-3.5" />
                                                    Aktifkan kembali
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        {user.can_delete && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() =>
                                                        setDeleting(user)
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Hapus akun
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                        {users.data.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm font-medium">
                                    Pengguna tidak ditemukan
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Sesuaikan filter atau buat akun anggota tim.
                                </p>
                            </div>
                        )}
                        <Pagination links={users.links} />
                    </div>
                </div>
            </div>
            {editing && (
                <EditUserDialog
                    key={editing.id}
                    user={editing}
                    roles={roles}
                    open
                    onOpenChange={(open) => {
                        if (!open) setEditing(null);
                    }}
                />
            )}
            {deleting && (
                <DeleteUserDialog
                    user={deleting}
                    open
                    onOpenChange={(open) => {
                        if (!open) setDeleting(null);
                    }}
                />
            )}
        </>
    );
}

function DeleteUserDialog({
    user,
    open,
    onOpenChange,
}: {
    user: ManagedUser;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [processing, setProcessing] = useState(false);

    const destroy = () => {
        setProcessing(true);
        router.delete(`/administration/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle>Hapus akun {user.name}?</DialogTitle>
                    <DialogDescription>
                        Akun tidak dapat login dan hilang dari daftar pengguna.
                        Proyek, tugas, komentar, dan riwayat pekerjaan tetap
                        tersimpan.
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-muted/40 rounded-xl border p-3 text-sm">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-xs">
                        {user.email}
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={destroy}
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Hapus akun
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CreateUserDialog({ roles }: { roles: Option[] }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        email: '',
        role: 'member',
        password: '',
        password_confirmation: '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/administration/users', {
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                    <Plus className="size-3.5" />
                    Buat pengguna
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Buat akun anggota tim</DialogTitle>
                    <DialogDescription>
                        Pengguna dapat langsung masuk. Bagikan kata sandi
                        sementara melalui saluran internal yang aman.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <FormField label="Nama lengkap" error={form.errors.name}>
                        <Input
                            autoFocus
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            autoComplete="name"
                        />
                    </FormField>
                    <FormField label="Email" error={form.errors.email}>
                        <Input
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            autoComplete="off"
                        />
                    </FormField>
                    <FormField label="Peran global" error={form.errors.role}>
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
                                {roles.map((role) => (
                                    <SelectItem
                                        key={role.value}
                                        value={role.value}
                                    >
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                            label="Kata sandi sementara"
                            error={form.errors.password}
                        >
                            <Input
                                type="password"
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                autoComplete="new-password"
                            />
                        </FormField>
                        <FormField label="Konfirmasi kata sandi">
                            <Input
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                autoComplete="new-password"
                            />
                        </FormField>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}Buat pengguna
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog({
    user,
    roles,
    open,
    onOpenChange,
}: {
    user: ManagedUser;
    roles: Option[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        password: '',
        password_confirmation: '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(`/administration/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit pengguna</DialogTitle>
                    <DialogDescription>
                        Perbarui akses, peran, atau kata sandi pengguna. Riwayat
                        pekerjaan tetap terhubung ke akun ini.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <FormField label="Nama lengkap" error={form.errors.name}>
                        <Input
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                    </FormField>
                    <FormField label="Email" error={form.errors.email}>
                        <Input
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                        />
                    </FormField>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                            label="Peran global"
                            error={form.errors.role}
                        >
                            <Select
                                value={form.data.role}
                                onValueChange={(value) =>
                                    form.setData('role', value as User['role'])
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.value}
                                            value={role.value}
                                        >
                                            {role.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField
                            label="Status akun"
                            error={form.errors.is_active}
                        >
                            <Select
                                value={
                                    form.data.is_active ? 'active' : 'inactive'
                                }
                                onValueChange={(value) =>
                                    form.setData(
                                        'is_active',
                                        value === 'active',
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Aktif
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Nonaktif
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </FormField>
                    </div>
                    <div className="bg-muted/30 rounded-md border p-3">
                        <p className="mb-3 text-xs font-medium">
                            Atur kata sandi baru{' '}
                            <span className="text-muted-foreground font-normal">
                                (opsional)
                            </span>
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormField
                                label="Kata sandi baru"
                                error={form.errors.password}
                            >
                                <Input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    autoComplete="new-password"
                                />
                            </FormField>
                            <FormField label="Konfirmasi kata sandi">
                                <Input
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(event) =>
                                        form.setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                    autoComplete="new-password"
                                />
                            </FormField>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}Simpan perubahan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FormField({
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
