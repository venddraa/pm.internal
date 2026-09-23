import { Link, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    Home,
    ListTodo,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { BrandLogo } from '@/components/app/brand-logo';
import { NavUser } from '@/components/nav-user';
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
    SidebarRail,
} from '@/components/ui/sidebar';

const primaryItems = [
    { label: 'Beranda', href: '/home', icon: Home },
    { label: 'Tugas Saya', href: '/my-tasks', icon: ListTodo },
    { label: 'Pekerjaan', href: '/projects', icon: BriefcaseBusiness },
];

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
                        <SidebarMenu className="gap-1">
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
                                        className="h-9 font-medium"
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
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {auth.user?.role === 'admin' && (
                    <SidebarGroup className="mt-5 p-0">
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
                                        className="h-9"
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
                            className="h-9"
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
