import { Head, Link, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Pagination } from '@/components/app/pagination';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { ProjectIcon } from '@/components/projects/project-icon';
import {
    HealthBadge,
    ProjectStatusBadge,
} from '@/components/tasks/task-indicators';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/format';
import type { Option, Paginated, Project, User } from '@/types';

export default function ProjectsIndex({
    projects,
    filters,
    projectStatuses,
    projectHealth,
    owners,
    canCreate,
}: {
    projects: Paginated<Project>;
    filters: Record<string, string | undefined>;
    projectStatuses: Option[];
    projectHealth: Option[];
    owners: User[];
    canCreate: boolean;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const navigate = (key: string, value: string) =>
        router.get(
            '/projects',
            { ...filters, [key]: value === 'all' ? undefined : value },
            { preserveState: true, replace: true },
        );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        navigate('search', search.trim());
    };
    return (
        <>
            <Head title="Pekerjaan" />
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="bg-card flex items-center justify-between gap-4 border-b px-5 py-4">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Pekerjaan
                        </h1>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            Pantau penanggung jawab, kondisi, progres, dan
                            tenggat setiap pekerjaan departemen.
                        </p>
                    </div>
                    {canCreate ? (
                        <CreateProjectDialog owners={owners} />
                    ) : (
                        <span className="text-muted-foreground hidden max-w-48 text-right text-xs sm:block">
                            Hubungi admin atau manajer untuk membuat pekerjaan
                            baru.
                        </span>
                    )}
                </div>
                <div className="bg-card flex flex-wrap items-center gap-2 border-b px-4 py-2">
                    <form onSubmit={submit} className="relative w-64">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                        <Input
                            className="h-8 pl-8 text-xs shadow-none"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari pekerjaan…"
                        />
                    </form>
                    <Select
                        value={filters.status ?? 'all'}
                        onValueChange={(value) => navigate('status', value)}
                    >
                        <SelectTrigger size="sm" className="w-36">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua status</SelectItem>
                            {projectStatuses.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.health ?? 'all'}
                        onValueChange={(value) => navigate('health', value)}
                    >
                        <SelectTrigger size="sm" className="w-36">
                            <SelectValue placeholder="Kondisi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua kondisi</SelectItem>
                            {projectHealth.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="sam-scrollbar min-h-0 flex-1 overflow-auto p-4">
                    <div className="bg-card border-border/60 min-w-[780px] overflow-hidden rounded-2xl border shadow-sm">
                        <div className="bg-muted/70 text-muted-foreground grid h-8 grid-cols-[minmax(270px,1fr)_150px_110px_120px_170px_110px] items-center px-3 text-[10px] font-semibold tracking-wider uppercase">
                            <span>Pekerjaan</span>
                            <span>PIC utama</span>
                            <span>Status</span>
                            <span>Kondisi</span>
                            <span>Progres</span>
                            <span>Tenggat</span>
                        </div>
                        {projects.data.map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.key}/list`}
                                className="hover:bg-muted/35 grid min-h-14 grid-cols-[minmax(270px,1fr)_150px_110px_120px_170px_110px] items-center border-t px-3 text-xs"
                            >
                                <span className="flex min-w-0 items-center gap-2.5">
                                    <ProjectIcon projectKey={project.key} />
                                    <span className="min-w-0">
                                        <span className="block truncate font-medium">
                                            {project.name}
                                        </span>
                                        <span className="text-muted-foreground font-mono text-[10px]">
                                            {project.key}
                                        </span>
                                    </span>
                                </span>
                                <span className="text-muted-foreground truncate">
                                    {project.owner.name}
                                </span>
                                <span>
                                    <ProjectStatusBadge
                                        value={project.status}
                                        label={project.status_label}
                                    />
                                </span>
                                <span>
                                    <HealthBadge
                                        value={project.health}
                                        label={project.health_label}
                                    />
                                </span>
                                <span className="flex items-center gap-2">
                                    <Progress
                                        value={project.progress.percent}
                                        className="w-24"
                                    />
                                    <span className="text-muted-foreground w-8 text-right text-[11px]">
                                        {project.progress.percent}%
                                    </span>
                                </span>
                                <span className="text-muted-foreground">
                                    {formatDate(project.due_date, {
                                        day: '2-digit',
                                        month: 'short',
                                        year: '2-digit',
                                    })}
                                </span>
                            </Link>
                        ))}
                        {projects.data.length === 0 && (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm font-medium">
                                    Pekerjaan tidak ditemukan
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Sesuaikan filter atau buat pekerjaan baru.
                                </p>
                            </div>
                        )}
                        <Pagination links={projects.links} />
                    </div>
                </div>
            </div>
        </>
    );
}
