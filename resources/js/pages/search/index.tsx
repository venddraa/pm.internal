import { Head } from '@inertiajs/react';
import { FolderKanban, Search as SearchIcon } from 'lucide-react';
import { ProjectIcon } from '@/components/projects/project-icon';
import { TaskSummaryRow } from '@/components/tasks/task-summary-row';
import type { Project, Task } from '@/types';

export default function Search({
    query,
    projects,
    tasks,
}: {
    query: string;
    projects: Project[];
    tasks: Task[];
}) {
    return (
        <>
            <Head title="Pencarian" />
            <div className="sam-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-5">
                        <h1 className="text-lg font-semibold">Pencarian</h1>
                        <p className="text-muted-foreground mt-1 text-xs">
                            {query
                                ? `Hasil pencarian “${query}”`
                                : 'Masukkan sedikitnya dua karakter pada kolom pencarian.'}
                        </p>
                    </div>
                    {query && projects.length === 0 && tasks.length === 0 ? (
                        <div className="bg-card border-border/60 rounded-2xl border px-6 py-14 text-center shadow-sm">
                            <SearchIcon className="text-muted-foreground mx-auto size-5" />
                            <p className="mt-3 text-sm font-medium">
                                Hasil tidak ditemukan
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-5">
                            <section className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
                                <div className="flex items-center gap-2 border-b px-4 py-3">
                                    <FolderKanban className="text-muted-foreground size-4" />
                                    <h2 className="text-sm font-semibold">
                                        Proyek
                                    </h2>
                                    <span className="text-muted-foreground text-xs">
                                        {projects.length}
                                    </span>
                                </div>
                                {projects.map((project) => (
                                    <a
                                        key={project.id}
                                        href={`/projects/${project.key}/overview`}
                                        className="hover:bg-muted/35 flex items-center gap-3 border-t px-4 py-3 first:border-t-0"
                                    >
                                        <ProjectIcon projectKey={project.key} />
                                        <div>
                                            <p className="text-xs font-medium">
                                                {project.name}
                                            </p>
                                            <p className="text-muted-foreground font-mono text-[10px]">
                                                {project.key}
                                            </p>
                                        </div>
                                    </a>
                                ))}
                                {projects.length === 0 && (
                                    <p className="text-muted-foreground px-4 py-5 text-xs">
                                        Tidak ada proyek yang cocok.
                                    </p>
                                )}
                            </section>
                            <section className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
                                <div className="flex items-center gap-2 border-b px-4 py-3">
                                    <h2 className="text-sm font-semibold">
                                        Tugas
                                    </h2>
                                    <span className="text-muted-foreground text-xs">
                                        {tasks.length}
                                    </span>
                                </div>
                                {tasks.map((task) => (
                                    <TaskSummaryRow key={task.id} task={task} />
                                ))}
                                {tasks.length === 0 && (
                                    <p className="text-muted-foreground px-4 py-5 text-xs">
                                        Tidak ada tugas yang cocok.
                                    </p>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
