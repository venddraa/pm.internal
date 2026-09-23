import { router, useForm, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { User } from '@/types';

export function CreateProjectDialog({ owners }: { owners: User[] }) {
    const { url } = usePage();
    const requested =
        new URLSearchParams(url.split('?')[1]).get('create') === '1';
    const [open, setOpen] = useState(requested);
    useEffect(() => {
        if (requested) setOpen(true);
    }, [requested]);
    const changeOpen = (value: boolean) => {
        setOpen(value);
        if (!value && requested) {
            const params = new URLSearchParams(url.split('?')[1]);
            params.delete('create');
            router.get('/projects', Object.fromEntries(params), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }
    };
    const form = useForm({
        name: '',
        key: '',
        description: '',
        owner_id: String(owners[0]?.id ?? ''),
        start_date: '',
        due_date: '',
        progress_mode: 'checklist' as 'checklist' | 'numeric',
        target_value: '',
        progress_unit: '',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            owner_id: Number(data.owner_id),
            start_date: data.start_date || null,
            due_date: data.due_date || null,
        }));
        form.post('/projects', {
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };
    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-10 px-4">
                    <Plus className="size-3.5" />
                    Buat pekerjaan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Buat pekerjaan</DialogTitle>
                    <DialogDescription>
                        Buat pekerjaan tim dengan progres checklist atau target
                        angka.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                        <Field label="Nama pekerjaan" error={form.errors.name}>
                            <Input
                                autoFocus
                                value={form.data.name}
                                onChange={(event) => {
                                    const name = event.target.value;
                                    form.setData('name', name);
                                    if (!form.data.key)
                                        form.setData(
                                            'key',
                                            name
                                                .replace(/[^a-zA-Z0-9]/g, '')
                                                .slice(0, 4)
                                                .toUpperCase(),
                                        );
                                }}
                                placeholder="Internal Reporting Portal"
                            />
                        </Field>
                        <Field label="Kode pekerjaan" error={form.errors.key}>
                            <Input
                                value={form.data.key}
                                onChange={(event) =>
                                    form.setData(
                                        'key',
                                        event.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9]/g, '')
                                            .slice(0, 12),
                                    )
                                }
                                placeholder="IRP"
                                className="font-mono uppercase"
                            />
                        </Field>
                    </div>
                    <Field label="Deskripsi" error={form.errors.description}>
                        <textarea
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            className="bg-background min-h-24 rounded-md border px-3 py-2 text-sm"
                            placeholder="Apa hasil yang ingin dicapai?"
                        />
                    </Field>
                    <Field label="PIC utama" error={form.errors.owner_id}>
                        <Select
                            value={form.data.owner_id}
                            onValueChange={(value) =>
                                form.setData('owner_id', value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {owners.map((owner) => (
                                    <SelectItem
                                        key={owner.id}
                                        value={String(owner.id)}
                                    >
                                        {owner.name} · {owner.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                            label="Cara menghitung progres"
                            error={form.errors.progress_mode}
                        >
                            <Select
                                value={form.data.progress_mode}
                                onValueChange={(value) =>
                                    form.setData(
                                        'progress_mode',
                                        value as 'checklist' | 'numeric',
                                    )
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="checklist">
                                        Checklist tugas
                                    </SelectItem>
                                    <SelectItem value="numeric">
                                        Target angka / lokasi
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        {form.data.progress_mode === 'numeric' && (
                            <div className="grid grid-cols-[1fr_120px] gap-3">
                                <Field
                                    label="Target total"
                                    error={form.errors.target_value}
                                >
                                    <Input
                                        type="number"
                                        min="1"
                                        value={form.data.target_value}
                                        onChange={(event) =>
                                            form.setData(
                                                'target_value',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="700"
                                    />
                                </Field>
                                <Field
                                    label="Satuan"
                                    error={form.errors.progress_unit}
                                >
                                    <Input
                                        value={form.data.progress_unit}
                                        onChange={(event) =>
                                            form.setData(
                                                'progress_unit',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="titik"
                                    />
                                </Field>
                            </div>
                        )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                            label="Tanggal mulai"
                            error={form.errors.start_date}
                        >
                            <Input
                                type="date"
                                value={form.data.start_date}
                                onChange={(event) =>
                                    form.setData(
                                        'start_date',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="Tenggat" error={form.errors.due_date}>
                            <Input
                                type="date"
                                value={form.data.due_date}
                                onChange={(event) =>
                                    form.setData('due_date', event.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => changeOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                form.processing ||
                                !form.data.name.trim() ||
                                !form.data.key.trim()
                            }
                        >
                            {form.processing && <Spinner />}Buat pekerjaan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="grid gap-1.5">
            <Label>{label}</Label>
            {children}
            {error && <span className="text-destructive text-xs">{error}</span>}
        </label>
    );
}
