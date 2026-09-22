import type { Auth, AppNotification } from '@/types';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            navigation: {
                can_create_project?: boolean;
                my_tasks_count?: number;
                projects: Array<{
                    id: number;
                    name: string;
                    key: string;
                    can_create_task?: boolean;
                }>;
                unread_count: number;
                notifications: AppNotification[];
            };
            flash: { success: string | null; error: string | null };
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
