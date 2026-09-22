import { router } from '@inertiajs/react';
import { Filter, Layers3, Search, SlidersHorizontal, X } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Label, Option, User, WorkflowStatus } from '@/types';

type Filters = {
    search?: string;
    status?: number;
    priority?: string;
    assignee?: number;
    label?: number;
    due?: string;
    sort?: string;
    direction?: string;
};

export function TaskToolbar({
    filters,
    statuses,
    members,
    labels,
    priorityOptions,
}: {
    filters: Filters;
    statuses: WorkflowStatus[];
    members: User[];
    labels: Label[];
    priorityOptions: Option[];
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const activeFilters = [
        'status',
        'priority',
        'assignee',
        'label',
        'due',
    ].filter((key) => Boolean(filters[key as keyof Filters])).length;

    const navigate = (updates: Record<string, string | number | null>) => {
        const params = new URLSearchParams(window.location.search);
        params.delete('page');
        for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === '') {
                params.delete(key);
            } else {
                params.set(key, String(value));
            }
        }
        router.get(window.location.pathname, Object.fromEntries(params), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        navigate({ search: search.trim() || null });
    };

    return (
        <div className="bg-card border-border/60 flex min-h-14 flex-wrap items-center gap-2 border-b px-4 py-2.5">
            <form onSubmit={submit} className="relative w-56">
                <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="bg-background h-8 rounded-full pl-8 text-xs shadow-none"
                    placeholder="Cari tugas…"
                />
            </form>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                    >
                        <Filter className="size-3.5" />
                        Filter
                        {activeFilters > 0 && (
                            <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                                {activeFilters}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-semibold">Filter</p>
                        {activeFilters > 0 && (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate({
                                        status: null,
                                        priority: null,
                                        assignee: null,
                                        label: null,
                                        due: null,
                                    })
                                }
                                className="text-primary text-[11px] hover:underline"
                            >
                                Hapus semua
                            </button>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <FilterSelect
                            label="Status"
                            value={
                                filters.status ? String(filters.status) : 'all'
                            }
                            onChange={(value) =>
                                navigate({
                                    status: value === 'all' ? null : value,
                                })
                            }
                            options={[
                                { value: 'all', label: 'Semua status' },
                                ...statuses.map((status) => ({
                                    value: String(status.id),
                                    label: status.name,
                                })),
                            ]}
                        />
                        <FilterSelect
                            label="Prioritas"
                            value={filters.priority ?? 'all'}
                            onChange={(value) =>
                                navigate({
                                    priority: value === 'all' ? null : value,
                                })
                            }
                            options={[
                                { value: 'all', label: 'Semua prioritas' },
                                ...priorityOptions,
                            ]}
                        />
                        <FilterSelect
                            label="Penanggung jawab"
                            value={
                                filters.assignee
                                    ? String(filters.assignee)
                                    : 'all'
                            }
                            onChange={(value) =>
                                navigate({
                                    assignee: value === 'all' ? null : value,
                                })
                            }
                            options={[
                                { value: 'all', label: 'Semua anggota' },
                                ...members.map((member) => ({
                                    value: String(member.id),
                                    label: member.name,
                                })),
                            ]}
                        />
                        <FilterSelect
                            label="Label"
                            value={
                                filters.label ? String(filters.label) : 'all'
                            }
                            onChange={(value) =>
                                navigate({
                                    label: value === 'all' ? null : value,
                                })
                            }
                            options={[
                                { value: 'all', label: 'Semua label' },
                                ...labels.map((label) => ({
                                    value: String(label.id),
                                    label: label.name,
                                })),
                            ]}
                        />
                        <FilterSelect
                            label="Tenggat"
                            value={filters.due ?? 'all'}
                            onChange={(value) =>
                                navigate({
                                    due: value === 'all' ? null : value,
                                })
                            }
                            options={[
                                { value: 'all', label: 'Semua tenggat' },
                                { value: 'overdue', label: 'Terlambat' },
                                {
                                    value: 'today',
                                    label: 'Jatuh tempo hari ini',
                                },
                                {
                                    value: 'week',
                                    label: 'Jatuh tempo minggu ini',
                                },
                                { value: 'no_date', label: 'Tanpa tenggat' },
                            ]}
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                    >
                        <SlidersHorizontal className="size-3.5" />
                        Urutkan
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64">
                    <div className="grid gap-2">
                        <FilterSelect
                            label="Urutkan"
                            value={filters.sort ?? 'updated'}
                            onChange={(value) => navigate({ sort: value })}
                            options={[
                                {
                                    value: 'updated',
                                    label: 'Terakhir diperbarui',
                                },
                                { value: 'created', label: 'Tanggal dibuat' },
                                { value: 'due', label: 'Tenggat' },
                                { value: 'priority', label: 'Prioritas' },
                                { value: 'task_id', label: 'Task ID' },
                                { value: 'position', label: 'Urutan manual' },
                            ]}
                        />
                        <FilterSelect
                            label="Arah"
                            value={filters.direction ?? 'desc'}
                            onChange={(value) => navigate({ direction: value })}
                            options={[
                                { value: 'asc', label: 'Naik' },
                                { value: 'desc', label: 'Turun' },
                            ]}
                        />
                    </div>
                </PopoverContent>
            </Popover>
            <span className="text-muted-foreground ml-auto hidden items-center gap-1.5 text-[11px] sm:flex">
                <Layers3 className="size-3.5" />
                Dikelompokkan per status
            </span>
            {(activeFilters > 0 || filters.search) && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => {
                        setSearch('');
                        router.get(
                            window.location.pathname,
                            {},
                            { replace: true },
                        );
                    }}
                >
                    <X className="size-3.5" />
                    Atur ulang
                </Button>
            )}
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label className="grid grid-cols-[80px_1fr] items-center gap-2 text-xs">
            <span className="text-muted-foreground">{label}</span>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger size="sm" className="w-full">
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
        </label>
    );
}
