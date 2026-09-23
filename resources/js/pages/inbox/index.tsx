import { Head, Link, router } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { Pagination } from '@/components/app/pagination';
import { Button } from '@/components/ui/button';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AppNotification, Paginated } from '@/types';

export default function Inbox({
    notifications,
}: {
    notifications: Paginated<AppNotification>;
}) {
    const unread = notifications.data.some((item) => !item.read_at);
    return (
        <>
            <Head title="Kotak Masuk" />
            <div className="sam-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                <div className="bg-card border-border/60 mx-auto max-w-3xl overflow-hidden rounded-2xl border shadow-sm">
                    <div className="flex items-start justify-between border-b px-5 py-4">
                        <div>
                            <h1 className="text-base font-semibold">
                                Kotak Masuk
                            </h1>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Penugasan dan pembaruan pekerjaan yang penting.
                            </p>
                        </div>
                        {unread && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => router.patch('/inbox/read-all')}
                            >
                                <CheckCheck className="size-3.5" />
                                Tandai semua dibaca
                            </Button>
                        )}
                    </div>
                    <div className="divide-y">
                        {notifications.data.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    'flex gap-3 px-5 py-4',
                                    !notification.read_at &&
                                        'bg-blue-50/45 dark:bg-blue-950/20',
                                )}
                            >
                                <span
                                    className={cn(
                                        'bg-muted text-muted-foreground mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                                        !notification.read_at &&
                                            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
                                    )}
                                >
                                    <Bell className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xs font-semibold">
                                            {notification.title}
                                        </h2>
                                        {!notification.read_at && (
                                            <span className="bg-primary size-1.5 rounded-full" />
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {notification.message}
                                    </p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className="text-muted-foreground text-[10px]">
                                            {relativeTime(
                                                notification.created_at,
                                            )}
                                        </span>
                                        {notification.url && (
                                            <Link
                                                href={notification.url}
                                                className="text-primary text-[11px] font-medium hover:underline"
                                            >
                                                Buka
                                            </Link>
                                        )}
                                        {!notification.read_at && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.patch(
                                                        `/inbox/${notification.id}/read`,
                                                    )
                                                }
                                                className="text-muted-foreground hover:text-foreground text-[11px] font-medium"
                                            >
                                                Tandai dibaca
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {notifications.data.length === 0 && (
                            <div className="px-5 py-14 text-center">
                                <Bell className="text-muted-foreground mx-auto size-5" />
                                <p className="mt-3 text-sm font-medium">
                                    Tidak ada notifikasi baru
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Penugasan dan pembaruan pekerjaan akan
                                    tampil di sini.
                                </p>
                            </div>
                        )}
                    </div>
                    <Pagination links={notifications.links} />
                </div>
            </div>
        </>
    );
}
