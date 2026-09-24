import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarCheck2,
    ListChecks,
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

const mainItems = [
    { label: 'Agenda Tim', href: '/home', icon: CalendarCheck2 },
    { label: 'Tugas Saya', href: '/home?view=mine', icon: ListChecks },
    { label: 'Kotak Masuk', href: '/inbox', icon: Bell },
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
            <SidebarContent className="gap-0 px-2 py-3">
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="text-sidebar-foreground/60 px-2 text-[10px] font-semibold tracking-[0.14em]">
                        RUANG KERJA
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {mainItems.map((item) => {
                                const active =
                                    item.href === '/home'
                                        ? currentUrl === '/home' ||
                                          (currentUrl.startsWith('/home?') &&
                                              !currentUrl.includes('view=mine'))
                                        : currentUrl.startsWith(item.href);
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.label}
                                            isActive={active}
                                            className="h-9 font-medium"
                                        >
                                            <Link href={item.href} prefetch>
                                                <item.icon className="size-4" />
                                                <span>{item.label}</span>
                                                {item.label === 'Tugas Saya' &&
                                                    (navigation.my_tasks_count ??
                                                        0) > 0 && (
                                                        <span className="bg-sidebar-accent ml-auto rounded-full px-2 text-xs">
                                                            {
                                                                navigation.my_tasks_count
                                                            }
                                                        </span>
                                                    )}
                                                {item.label === 'Kotak Masuk' &&
                                                    navigation.unread_count >
                                                        0 && (
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
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {auth.user?.role === 'admin' && (
                    <SidebarGroup className="mt-5 p-0">
                        <SidebarGroupLabel className="text-sidebar-foreground/60 px-2 text-[10px] font-semibold tracking-[0.14em]">
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
                                        <Link href="/administration/users">
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
