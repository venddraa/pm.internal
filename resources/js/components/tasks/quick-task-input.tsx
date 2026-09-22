import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

export function QuickTaskInput({
    projectKey,
    statusId,
}: {
    projectKey: string;
    statusId: number;
}) {
    const [active, setActive] = useState(false);
    const form = useForm({ title: '', status_id: statusId });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!form.data.title.trim()) return;
        form.post(`/projects/${projectKey}/tasks`, {
            preserveScroll: true,
            only: ['tasks', 'statuses', 'project', 'flash'],
            onSuccess: () => form.reset('title'),
        });
    };

    if (!active) {
        return (
            <button
                type="button"
                onClick={() => setActive(true)}
                className="text-muted-foreground hover:bg-muted/70 hover:text-foreground flex h-8 w-full items-center gap-1.5 px-3 text-xs"
            >
                <Plus className="size-3.5" />
                Tambah tugas
            </button>
        );
    }

    return (
        <form
            onSubmit={submit}
            className="bg-card flex h-9 items-center gap-2 border-t px-3"
        >
            {form.processing ? (
                <Spinner className="size-3.5" />
            ) : (
                <Plus className="text-primary size-3.5" />
            )}
            <input
                autoFocus
                value={form.data.title}
                onChange={(event) => form.setData('title', event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') setActive(false);
                }}
                onBlur={() => {
                    if (!form.data.title) setActive(false);
                }}
                placeholder="Nama tugas…"
                className="h-7 min-w-0 flex-1 bg-transparent text-xs"
                aria-label="Judul tugas baru"
            />
            <span className="text-muted-foreground text-[10px]">
                Enter untuk membuat
            </span>
        </form>
    );
}
