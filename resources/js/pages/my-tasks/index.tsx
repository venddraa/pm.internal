import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Pagination } from '@/components/app/pagination';
import { TaskSummaryRow } from '@/components/tasks/task-summary-row';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Option, Paginated, Task } from '@/types';

type ProjectOption = { id: number; name: string; key: string };

export default function MyTasks({
    tasks,
    filters,
    projects,
    priorityOptions,
    summary,
}: {
    summary: { open: number; completed: number; all: number };
    tasks: Paginated<Task>;
    filters: Record<string, string | number | undefined>;
    projects: ProjectOption[];
    priorityOptions: Option[];
}) {
    const [search, setSearch] = useState(String(filters.search ?? ''));
    const navigate = (updates: Record<string, string | number | undefined>) =>
        router.get(
            '/my-tasks',
            { ...filters, ...updates },
            { preserveState: true, replace: true },
        );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        navigate({ search: search.trim() || undefined });
    };
    const sections = {
        overdue: [] as Task[],
        today: [] as Task[],
        upcoming: [] as Task[],
        no_date: [] as Task[],
        completed: [] as Task[],
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const task of tasks.data) {
        if (task.status.category === 'done') sections.completed.push(task);
        else if (!task.due_date) sections.no_date.push(task);
        else {
            const due = new Date(`${task.due_date}T00:00:00`);
            if (due < today) sections.overdue.push(task);
            else if (due.getTime() === today.getTime())
                sections.today.push(task);
            else sections.upcoming.push(task);
        }
    }
    const labels = {
        overdue: 'Terlambat',
        today: 'Hari ini',
        upcoming: 'Mendatang',
        no_date: 'Tanpa tenggat',
        completed: 'Selesai',
    };
    return (
        <>
            <Head title="Tugas Saya" />
            <div className="flex min-h-0 flex-1 flex-col">
                <div className="bg-card border-b px-5 py-4">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Tugas Saya
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Semua tugas yang ditugaskan kepadamu, dari seluruh
                        proyek. Centang untuk selesai atau klik judul untuk
                        detail.
                    </p>
                </div>
                <div
                    className="bg-card flex flex-wrap gap-2 border-b px-5 pb-4"
                    aria-label="Status tugas saya"
                >
                    {(
                        [
                            { key: 'open', label: 'Belum selesai' },
                            { key: 'completed', label: 'Selesai' },
                            { key: 'all', label: 'Semua' },
                        ] as const
                    ).map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            aria-pressed={filters.state === item.key}
                            onClick={() => navigate({ state: item.key })}
                            className={`rounded-full px-4 py-2 text-sm font-medium ${filters.state === item.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                        >
                            {item.label}{' '}
                            <span className="ml-2 opacity-80">
                                {summary[item.key]}
                            </span>
                        </button>
                    ))}
                </div>
                <div className="bg-card flex flex-wrap gap-2 border-b px-4 py-2">
                    <form onSubmit={submit} className="relative w-60">
                        <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                        <Input
                            className="h-8 pl-8 text-xs"
                            placeholder="Cari tugas saya…"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </form>
                    <Filter
                        value={String(filters.state ?? 'open')}
                        onChange={(value) =>
                            navigate({
                                state: value,
                            })
                        }
                        options={[
                            { value: 'open', label: 'Semua tenggat aktif' },
                            { value: 'all', label: 'Semua tugas' },
                            ...Object.entries(labels).map(([value, label]) => ({
                                value,
                                label,
                            })),
                        ]}
                    />
                    <Filter
                        value={String(filters.project ?? 'all')}
                        onChange={(value) =>
                            navigate({
                                project:
                                    value === 'all' ? undefined : Number(value),
                            })
                        }
                        options={[
                            { value: 'all', label: 'Semua proyek' },
                            ...projects.map((project) => ({
                                value: String(project.id),
                                label: project.name,
                            })),
                        ]}
                    />
                    <Filter
                        value={String(filters.priority ?? 'all')}
                        onChange={(value) =>
                            navigate({
                                priority: value === 'all' ? undefined : value,
                            })
                        }
                        options={[
                            { value: 'all', label: 'Semua prioritas' },
                            ...priorityOptions,
                        ]}
                    />
                    <Filter
                        value={String(filters.sort ?? 'due')}
                        onChange={(value) => navigate({ sort: value })}
                        options={[
                            { value: 'due', label: 'Tenggat' },
                            { value: 'updated', label: 'Terakhir diperbarui' },
                            { value: 'priority', label: 'Prioritas' },
                            { value: 'task_id', label: 'Task ID' },
                        ]}
                    />
                </div>
                <div className="sam-scrollbar min-h-0 flex-1 overflow-auto p-4">
                    <div className="bg-card border-border/60 mx-auto max-w-5xl overflow-hidden rounded-2xl border shadow-sm">
                        {(
                            Object.keys(sections) as Array<
                                keyof typeof sections
                            >
                        ).map(
                            (key) =>
                                sections[key].length > 0 && (
                                    <section key={key}>
                                        <div className="bg-muted/60 flex h-8 items-center gap-2 border-t px-3 first:border-t-0">
                                            <span
                                                className={`size-2 rounded-full ${key === 'overdue' ? 'bg-red-500' : key === 'today' ? 'bg-blue-500' : key === 'completed' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                            />
                                            <h2 className="text-[10px] font-semibold tracking-wider uppercase">
                                                {labels[key]}
                                            </h2>
                                            <span className="text-muted-foreground text-[10px]">
                                                {sections[key].length}
                                            </span>
                                        </div>
                                        {sections[key].map((task) => (
                                            <TaskSummaryRow
                                                key={task.id}
                                                task={task}
                                            />
                                        ))}
                                    </section>
                                ),
                        )}
                        {tasks.data.length === 0 && (
                            <div className="px-5 py-14 text-center">
                                <p className="text-sm font-medium">
                                    Tidak ada tugas pada tampilan ini
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Tugas yang ditugaskan kepadamu akan muncul
                                    di sini. Coba tampilan Semua atau sesuaikan
                                    filter pencarian.
                                </p>
                            </div>
                        )}
                        <Pagination links={tasks.links} />
                    </div>
                </div>
            </div>
        </>
    );
}

function Filter({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger size="sm" className="w-36">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
