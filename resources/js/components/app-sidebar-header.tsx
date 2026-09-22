import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Bell, ChevronRight, Plus, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { UserAvatar } from '@/components/app/user-avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Spinner } from '@/components/ui/spinner';
import type { Project } from '@/types';

function GlobalTaskDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { navigation } = usePage().props;
    const projects = navigation.projects.filter(
        (project) => project.can_create_task !== false,
    );
    const form = useForm({ project_key: projects[0]?.key ?? '', title: '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!form.data.project_key) return;
        form.post(`/projects/${form.data.project_key}/tasks`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('title');
                onOpenChange(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Buat tugas</DialogTitle>
                    <DialogDescription>
                        Tambahkan pekerjaan ke proyek yang dapat kamu akses.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="global-project">Proyek</Label>
                        <Select
                            value={form.data.project_key}
                            onValueChange={(value) =>
                                form.setData('project_key', value)
                            }
                        >
                            <SelectTrigger
                                id="global-project"
                                className="w-full"
                            >
                                <SelectValue placeholder="Pilih proyek" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={project.key}
                                    >
                                        {project.key} · {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="global-task-title">Judul tugas</Label>
                        <Input
                            id="global-task-title"
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            autoFocus
                            placeholder="Apa yang perlu dikerjakan?"
                        />
                        {form.errors.title && (
                            <p className="text-destructive text-xs">
                                {form.errors.title}
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                form.processing ||
                                !form.data.title.trim() ||
                                !form.data.project_key
                            }
                        >
                            {form.processing && <Spinner />}Buat tugas
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function AppSidebarHeader() {
    const page = usePage();
    const { auth, navigation } = page.props;
    const project = (page.props as { project?: Project }).project;
    const [search, setSearch] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        if (search.trim().length >= 2)
            router.get('/search', { q: search.trim() });
    };

    return (
        <>
            <header className="sam-chrome flex h-16 shrink-0 items-center justify-between gap-3 px-3 md:px-5">
                <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                    <SidebarTrigger className="mr-1" />
                    {project ? (
                        <>
                            <Link
                                href="/projects"
                                className="hover:text-foreground hidden sm:inline"
                            >
                                Proyek
                            </Link>
                            <ChevronRight className="hidden size-3.5 sm:block" />
                            <span className="text-foreground truncate font-medium">
                                {project.name}
                            </span>
                        </>
                    ) : (
                        <span className="text-foreground truncate font-medium">
                            Saya Akan Monitor
                        </span>
                    )}
                </div>
                <form
                    onSubmit={submitSearch}
                    className="relative hidden w-full max-w-[340px] lg:block"
                >
                    <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="bg-muted/60 h-9 rounded-full border-white/15 pl-8 text-xs shadow-none"
                        placeholder="Cari proyek atau tugas…"
                        aria-label="Pencarian global"
                    />
                </form>
                <div className="flex shrink-0 items-center gap-1.5">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="sm"
                                className="h-9 px-3"
                                aria-label="Buat baru"
                            >
                                <Plus className="size-4" />
                                <span>Buat</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                Buat di ruang kerja
                            </DropdownMenuLabel>
                            {navigation.can_create_project && (
                                <DropdownMenuItem asChild>
                                    <Link href="/projects?create=1">
                                        <Plus className="size-4" />
                                        Proyek baru
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => setCreateOpen(true)}
                                disabled={
                                    !navigation.projects.some(
                                        (item) =>
                                            item.can_create_task !== false,
                                    )
                                }
                            >
                                <Plus className="size-4" />
                                Tugas baru
                            </DropdownMenuItem>
                            {!navigation.projects.length && (
                                <p className="text-muted-foreground px-2 py-2 text-xs">
                                    {navigation.can_create_project
                                        ? 'Buat proyek terlebih dahulu untuk menambahkan tugas.'
                                        : 'Minta admin menambahkanmu ke proyek.'}
                                </p>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative size-8"
                                aria-label="Notifikasi"
                            >
                                <Bell className="size-4" />
                                {navigation.unread_count > 0 && (
                                    <span className="ring-card absolute top-1 right-1 size-2 rounded-full bg-red-500 ring-2" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <DropdownMenuLabel className="p-0">
                                    Notifikasi
                                </DropdownMenuLabel>
                                {navigation.unread_count > 0 && (
                                    <button
                                        type="button"
                                        className="text-primary text-[11px] font-medium hover:underline"
                                        onClick={() =>
                                            router.patch('/inbox/read-all')
                                        }
                                    >
                                        Tandai semua dibaca
                                    </button>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            {navigation.notifications.length === 0 ? (
                                <p className="text-muted-foreground px-3 py-5 text-center text-xs">
                                    Tidak ada notifikasi baru.
                                </p>
                            ) : (
                                navigation.notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification.id}
                                        asChild
                                        className="items-start py-2.5"
                                    >
                                        <Link
                                            href={notification.url ?? '/inbox'}
                                        >
                                            <span
                                                className="bg-primary mt-1 size-2 shrink-0 rounded-full"
                                                style={{
                                                    opacity:
                                                        notification.read_at
                                                            ? 0
                                                            : 1,
                                                }}
                                            />
                                            <span className="min-w-0">
                                                <span className="block text-xs font-medium">
                                                    {notification.title}
                                                </span>
                                                <span className="text-muted-foreground line-clamp-2 text-[11px]">
                                                    {notification.message}
                                                </span>
                                            </span>
                                        </Link>
                                    </DropdownMenuItem>
                                ))
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/inbox"
                                    className="justify-center text-xs font-medium"
                                >
                                    Lihat kotak masuk{' '}
                                    <ChevronRight className="size-3.5" />
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    {auth.user && (
                        <UserAvatar
                            user={auth.user}
                            className="hidden size-7 sm:flex"
                        />
                    )}
                </div>
            </header>
            <GlobalTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
        </>
    );
}
