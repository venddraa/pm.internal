import { Link, router, usePage } from '@inertiajs/react';
import { Bell, ChevronRight, Plus, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { UserAvatar } from '@/components/app/user-avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AppSidebarHeader() {
    const { auth, navigation } = usePage().props;
    const pageUrl = usePage().url;
    const initialSearch = pageUrl.startsWith('/home')
        ? (new URLSearchParams(pageUrl.split('?')[1] ?? '').get('search') ?? '')
        : '';
    const [search, setSearch] = useState(initialSearch);

    const submitSearch = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/home',
            { search: search.trim() || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <header className="sam-chrome flex h-16 shrink-0 items-center gap-3 px-3 md:px-5">
            <SidebarTrigger className="-ml-1" />
            <div className="hidden min-w-0 sm:block">
                <p className="truncate text-xs font-semibold">
                    IT Planning &amp; Governance
                </p>
                <p className="text-muted-foreground truncate text-[10px]">
                    Agenda pekerjaan tim
                </p>
            </div>
            <form
                onSubmit={submitSearch}
                className="relative mx-auto w-full max-w-md"
            >
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-9 rounded-full border-white/15 bg-white/8 pl-9 text-sm shadow-none focus-visible:border-white/35"
                    placeholder="Cari pekerjaan atau catatan…"
                />
            </form>
            <Button asChild size="sm" className="shrink-0 rounded-full px-4">
                <Link href="/home?buat=1">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Tambah</span>
                </Link>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative size-8 shrink-0 rounded-full"
                        aria-label="Notifikasi"
                    >
                        <Bell className="size-4" />
                        {navigation.unread_count > 0 && (
                            <span className="bg-primary absolute top-0.5 right-0.5 size-2 rounded-full" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifikasi terbaru</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {navigation.notifications.length === 0 ? (
                        <p className="text-muted-foreground px-3 py-5 text-center text-xs">
                            Belum ada notifikasi.
                        </p>
                    ) : (
                        navigation.notifications.map((notification) => (
                            <DropdownMenuItem key={notification.id} asChild>
                                <Link
                                    href={notification.url ?? '/inbox'}
                                    className="flex items-start gap-2 py-2"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-xs font-medium">
                                            {notification.title}
                                        </span>
                                        <span className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px]">
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
                            Buka kotak masuk
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {auth.user && (
                <UserAvatar
                    user={auth.user}
                    className="hidden size-8 shrink-0 sm:flex"
                />
            )}
        </header>
    );
}
