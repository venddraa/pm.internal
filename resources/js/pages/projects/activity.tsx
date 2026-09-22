import { Head } from '@inertiajs/react';
import { Pagination } from '@/components/app/pagination';
import { UserAvatar } from '@/components/app/user-avatar';
import { ProjectPage } from '@/components/projects/project-page';
import { relativeTime } from '@/lib/format';
import type { Activity, Paginated, Project } from '@/types';

export default function ProjectActivity({
    project,
    activity,
}: {
    project: Project;
    activity: Paginated<Activity>;
}) {
    return (
        <>
            <Head title={`${project.key} Aktivitas`} />
            <ProjectPage project={project}>
                <div className="sam-scrollbar h-full overflow-y-auto p-4 md:p-6">
                    <div className="bg-card border-border/60 mx-auto max-w-3xl overflow-hidden rounded-2xl border shadow-sm">
                        <div className="border-b px-5 py-4">
                            <h2 className="text-sm font-semibold">
                                Aktivitas proyek
                            </h2>
                            <p className="text-muted-foreground mt-1 text-xs">
                                Riwayat perubahan penting pada pekerjaan,
                                anggota, dan alur kerja proyek.
                            </p>
                        </div>
                        <div className="divide-y">
                            {activity.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-3 px-5 py-3.5"
                                >
                                    {item.actor ? (
                                        <UserAvatar
                                            user={item.actor}
                                            className="size-7"
                                        />
                                    ) : (
                                        <span className="bg-muted size-7 rounded-full" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs leading-5">
                                            {item.metadata.description ??
                                                item.event}
                                        </p>
                                        <p className="text-muted-foreground text-[10px]">
                                            {relativeTime(item.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {activity.data.length === 0 && (
                                <p className="text-muted-foreground px-5 py-12 text-center text-xs">
                                    Belum ada aktivitas yang tercatat.
                                </p>
                            )}
                        </div>
                        <Pagination links={activity.links} />
                    </div>
                </div>
            </ProjectPage>
        </>
    );
}
