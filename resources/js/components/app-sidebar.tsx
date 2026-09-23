import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    Columns3,
    FolderKanban,
    Home,
    Inbox,
    LayoutDashboard,
    ListTodo,
    Plus,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/app/brand-logo';
import { NavUser } from '@/components/nav-user';
import { ProjectIcon } from '@/components/projects/project-icon';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavProject = { id: number; name: string; key: string };

const primaryItems = [
    { label: 'Beranda', href: '/home', icon: Home },
    { label: 'Tugas Saya', href: '/my-tasks', icon: ListTodo },
    { label: 'Kotak Masuk', href: '/inbox', icon: Inbox },
    { label: 'Proyek', href: '/projects', icon: FolderKanban },
];

const projectViews: Array<{ label: string; view: string; icon: LucideIcon }> = [
    { label: 'Ringkasan', view: 'overview', icon: LayoutDashboard },
    { label: 'Daftar', view: 'list', icon: ListTodo },
    { label: 'Papan', view: 'board', icon: Columns3 },
];

function ProjectNavigationItem({
    project,
    currentUrl,
}: {
    project: NavProject;
    currentUrl: string;
}) {
    const selected = currentUrl.startsWith(`/projects/${project.key}`);
    const [open, setOpen] = useState(selected);

    useEffect(() => {
        if (selected) setOpen(true);
    }, [selected]);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="group/project"
        >
            <SidebarMenuItem className="mb-0.5">
                <div
                    className={cn(
                        'flex items-center rounded-md transition-colors',
                        selected && !open && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                        selected && open && 'text-sidebar-foreground font-medium',
                        'hover:bg-sidebar-accent/50',
                    )}
                >
                    <CollapsibleTrigger
                        className="text-muted-foreground hover:bg-background/50 hover:text-foreground ml-1 flex size-6 shrink-0 items-center justify-center rounded transition-colors group-data-[collapsible=icon]:hidden"
                        aria-label={`${open ? 'Tutup' : 'Buka'} ${project.name}`}
                    >
                        {open ? (
                            <ChevronDown className="size-3.5" />
                        ) : (
                            <ChevronRight className="size-3.5" />
                        )}
                    </CollapsibleTrigger>
                    <SidebarMenuButton
                        asChild
                        tooltip={project.name}
                        className="h-8 flex-1 px-1.5 font-normal hover:bg-transparent"
                    >
                        <Link href={`/projects/${project.key}/list`} prefetch>
                            <ProjectIcon
                                projectKey={project.key}
                                className="size-5 rounded text-[8px]"
                            />
                            <span className="truncate">{project.name}</span>
                        </Link>
                    </SidebarMenuButton>
                </div>
                <CollapsibleContent>
                    <SidebarMenuSub className="border-sidebar-border mt-1 mb-1 gap-0.5 py-0.5">
                        {projectViews.map(({ label, view, icon: Icon }) => (
                            <SidebarMenuSubItem key={view}>
                                <SidebarMenuSubButton
                                    asChild
                                    size="sm"
                                    isActive={currentUrl.startsWith(
                                        `/projects/${project.key}/${view}`,
                                    )}
                                    className="h-7 text-xs rounded-md"
                                >
                                    <Link
                                        href={`/projects/${project.key}/${view}`}
                                        prefetch
                                    >
                                        <Icon className="size-3.5" />
                                        <span>{label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function AppSidebar() {
    const { auth, navigation } = usePage().props;
    const currentUrl = usePage().url;

    return (
        <Sidebar collapsible="icon" variant="sidebar" className="border-r-0">
            <SidebarHeader className="h-20 justify-center px-3 py-3">
                <Link
                    href="/home"
                    className="flex min-w-0 items-center justify-center gap-2"
                >
                    <BrandLogo
                        white
                        className="w-40 shrink-0 group-data-[collapsible=icon]:hidden"
                    />
                    <span
                        className="sam-brand-symbol hidden size-8 shrink-0 bg-white group-data-[collapsible=icon]:block"
                        aria-label="Jasa Marga"
                        role="img"
                    />
                </Link>
            </SidebarHeader>
            <SidebarContent className="sam-scrollbar gap-0 px-2 py-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5">
                            {primaryItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.label}
                                        isActive={
                                            currentUrl === item.href ||
                                            (item.href !== '/home' &&
                                                currentUrl.startsWith(
                                                    item.href,
                                                ))
                                        }
                                        className="h-8 font-medium"
                                    >
                                        <Link href={item.href} prefetch>
                                            <item.icon className="size-4" />
                                            <span>{item.label}</span>
                                            {item.href === '/my-tasks' &&
                                                (navigation.my_tasks_count ??
                                                    0) > 0 && (
                                                    <span className="bg-sidebar-accent ml-auto rounded-full px-2 text-xs">
                                                        {
                                                            navigation.my_tasks_count
                                                        }
                                                    </span>
                                                )}
                                            {item.href === '/inbox' &&
                                                navigation.unread_count > 0 && (
                                                    <span className="bg-primary text-primary-foreground ml-auto rounded-full px-1.5 text-[10px] leading-4">
                                                        {Math.min(
                                                            navigation.unread_count,
                                                            99,
                                                        )}
                                                    </span>
                                                )}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup className="mt-3 p-0">
                    <SidebarGroupLabel className="text-muted-foreground h-7 px-2 text-[10px] font-semibold tracking-[0.12em]">
                        <span className="flex-1">PROYEK TIM</span>
                        {navigation.can_create_project && (
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="size-6"
                            >
                                <Link
                                    href="/projects?create=1"
                                    aria-label="Buat proyek baru"
                                >
                                    <Plus className="size-3.5" />
                                </Link>
                            </Button>
                        )}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {navigation.projects.map((project) => (
                                <ProjectNavigationItem
                                    key={project.id}
                                    project={project}
                                    currentUrl={currentUrl}
                                />
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {auth.user?.role === 'admin' && (
                    <SidebarGroup className="mt-3 p-0">
                        <SidebarGroupLabel className="text-muted-foreground h-7 px-2 text-[10px] font-semibold tracking-[0.12em]">
                            ADMINISTRASI
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip="Pengguna"
                                        isActive={currentUrl.startsWith(
                                            '/administration/users',
                                        )}
                                        className="h-8"
                                    >
                                        <Link
                                            href="/administration/users"
                                            prefetch
                                        >
                                            <Users className="size-4" />
                                            <span>Pengguna</span>
                                            <ShieldCheck className="text-primary ml-auto size-3.5" />
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="border-sidebar-border gap-1 border-t p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Pengaturan"
                            isActive={currentUrl.startsWith('/settings')}
                            className="h-8"
                        >
                            <Link href="/settings/profile">
                                <Settings className="size-4" />
                                <span>Pengaturan</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
