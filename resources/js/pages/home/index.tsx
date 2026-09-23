import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCheck,
    FolderPlus,
    ListTodo,
    Plus,
} from 'lucide-react';
import { ProjectIcon } from '@/components/projects/project-icon';
import { TaskSummaryRow } from '@/components/tasks/task-summary-row';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Project, Task } from '@/types';

const sections = [
    { key: 'overdue', label: 'Terlambat', dot: 'bg-red-500' },
    { key: 'today', label: 'Hari ini', dot: 'bg-blue-500' },
    { key: 'no_date', label: 'Tanpa tenggat', dot: 'bg-slate-400' },
    { key: 'upcoming', label: 'Mendatang', dot: 'bg-amber-500' },
] as const;
type Section = (typeof sections)[number]['key'];

export default function Home({
    taskSections,
    projects,
    summary,
    managerView,
    teamSummary,
}: {
    taskSections: Record<Section, Task[]>;
    projects: Project[];
    summary: {
        open: number;
        overdue: number;
        today: number;
        upcoming: number;
        no_date: number;
    };
    managerView: boolean;
    teamSummary: {
        works: number;
        open: number;
        overdue: number;
        attention: number;
    };
}) {
    const { auth, navigation } = usePage().props;
    return (
        <>
            <Head title="Beranda" />
            <div className="sam-scrollbar min-h-0 flex-1 overflow-y-auto p-4 md:p-7">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-muted-foreground text-sm">
                                {managerView
                                    ? 'Ringkasan departemen'
                                    : 'Ruang kerja saya'}
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                Halo, {auth.user?.name.split(' ')[0]}.
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm">
                                {managerView
                                    ? 'Pantau progres tim dan pekerjaan yang perlu perhatian.'
                                    : 'Lihat apa yang harus kamu kerjakan hari ini.'}
                            </p>
                        </div>
                        <Button asChild>
                            <Link
                                href={
                                    navigation.can_create_project
                                        ? '/projects?create=1'
                                        : '/projects'
                                }
                            >
                                <FolderPlus className="size-4" />
                                {navigation.can_create_project
                                    ? 'Buat pekerjaan'
                                    : 'Lihat pekerjaan tim'}
                            </Link>
                        </Button>
                    </div>
                    <div
                        className={`mb-6 grid gap-3 ${managerView ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}
                    >
                        {(managerView
                            ? [
                                  {
                                      label: 'Pekerjaan aktif',
                                      value: teamSummary.works,
                                      href: '/projects',
                                      main: true,
                                  },
                                  {
                                      label: 'Tugas tim terbuka',
                                      value: teamSummary.open,
                                      href: '/projects',
                                      main: false,
                                  },
                                  {
                                      label: 'Tugas tim terlambat',
                                      value: teamSummary.overdue,
                                      href: '/projects',
                                      main: false,
                                  },
                                  {
                                      label: 'Perlu perhatian',
                                      value: teamSummary.attention,
                                      href: '/projects?health=at_risk',
                                      main: false,
                                  },
                              ]
                            : [
                                  {
                                      label: 'Tugas saya belum selesai',
                                      value: summary.open,
                                      href: '/my-tasks',
                                      main: true,
                                  },
                                  {
                                      label: 'Perlu perhatian · terlambat',
                                      value: summary.overdue,
                                      href: '/my-tasks?state=overdue',
                                      main: false,
                                  },
                                  {
                                      label: 'Jatuh tempo hari ini',
                                      value: summary.today,
                                      href: '/my-tasks?state=today',
                                      main: false,
                                  },
                              ]
                        ).map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`group flex items-center justify-between rounded-2xl border p-5 transition-shadow hover:shadow-md ${item.main ? 'border-primary bg-primary text-primary-foreground' : 'bg-card border-border/60'}`}
                            >
                                <div>
                                    <span className="block text-3xl font-semibold">
                                        {item.value}
                                    </span>
                                    <span
                                        className={`mt-2 block text-xs ${item.main ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}
                                    >
                                        {item.label}
                                    </span>
                                </div>
                                <ArrowRight className="size-5 opacity-70" />
                            </Link>
                        ))}
                    </div>
                    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
                        <section className="bg-card border-border/60 overflow-hidden rounded-2xl border">
                            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                                <div>
                                    <h2 className="flex items-center gap-2 text-base font-semibold">
                                        <ListTodo className="text-primary size-5" />
                                        Ditugaskan kepada saya
                                    </h2>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        Centang untuk selesai. Klik judul untuk
                                        detail.
                                    </p>
                                </div>
                                <Link
                                    href="/my-tasks"
                                    className="text-primary text-sm font-medium"
                                >
                                    Lihat semua{' '}
                                    <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                            {summary.open === 0 ? (
                                <div className="border-t px-6 py-12 text-center">
                                    <CheckCheck className="text-primary mx-auto mb-3 size-8" />
                                    <h3 className="font-medium">
                                        Belum ada tugas yang perlu dikerjakan
                                    </h3>
                                    <p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm">
                                        Tugas yang ditugaskan kepadamu akan
                                        muncul di sini. Kamu juga bisa membuka
                                        pekerjaan tim untuk melihat daftar
                                        lengkap.
                                    </p>
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="mt-5"
                                    >
                                        <Link href="/projects">
                                            Buka pekerjaan tim
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                sections.map(
                                    ({ key, label, dot }) =>
                                        taskSections[key].length > 0 && (
                                            <section key={key}>
                                                <div className="bg-muted/45 flex items-center gap-2 border-t px-4 py-2.5">
                                                    <span
                                                        className={`size-2 rounded-full ${dot}`}
                                                    />
                                                    <h3 className="text-xs font-semibold">
                                                        {label}
                                                    </h3>
                                                    <Link
                                                        href={`/my-tasks?state=${key}`}
                                                        className="text-muted-foreground ml-auto text-xs"
                                                    >
                                                        Lihat semua
                                                    </Link>
                                                </div>
                                                {taskSections[key].map(
                                                    (task) => (
                                                        <TaskSummaryRow
                                                            key={task.id}
                                                            task={task}
                                                        />
                                                    ),
                                                )}
                                            </section>
                                        ),
                                )
                            )}
                        </section>
                        <section className="bg-card border-border/60 overflow-hidden rounded-2xl border">
                            <div className="flex items-center justify-between gap-2 p-5">
                                <h2 className="text-base font-semibold">
                                    Pekerjaan tim
                                </h2>
                                <Link
                                    href="/projects"
                                    className="text-primary text-sm font-medium"
                                >
                                    Semua pekerjaan
                                </Link>
                            </div>
                            {projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.key}/list`}
                                    className="hover:bg-muted/30 block border-t p-5"
                                >
                                    <div className="flex items-center gap-3">
                                        <ProjectIcon projectKey={project.key} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {project.name}
                                            </p>
                                            <p className="text-muted-foreground mt-1 text-xs">
                                                {project.progress_mode ===
                                                'numeric'
                                                    ? `${project.progress.completed}/${project.progress.total} ${project.progress_unit ?? 'item'}`
                                                    : `${project.progress.open} tugas belum selesai`}{' '}
                                                · {project.member_count} anggota
                                            </p>
                                        </div>
                                        <ArrowRight className="text-muted-foreground size-4" />
                                    </div>
                                    <div className="mt-4 flex items-center gap-3">
                                        <Progress
                                            value={project.progress.percent}
                                        />
                                        <span className="text-muted-foreground text-xs">
                                            {project.progress.percent}%
                                        </span>
                                    </div>
                                </Link>
                            ))}
                            {projects.length === 0 && (
                                <p className="text-muted-foreground border-t p-5 text-sm">
                                    Belum ada pekerjaan aktif.
                                </p>
                            )}
                            {navigation.can_create_project && (
                                <div className="border-t p-4">
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="w-full"
                                    >
                                        <Link href="/projects?create=1">
                                            <Plus className="size-4" />
                                            Buat pekerjaan baru
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}
