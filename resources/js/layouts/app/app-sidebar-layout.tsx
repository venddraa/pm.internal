import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({ children }: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="min-h-0 min-w-0 overflow-hidden bg-transparent"
            >
                <AppSidebarHeader />
                <div className="bg-background mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl shadow-[0_12px_40px_rgb(4_24_50/0.12)] md:mr-4 md:mb-4 md:ml-0">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
