import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { UserAvatar } from '@/components/app/user-avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label as FieldLabel } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { Label, Option, Project, User, WorkflowStatus } from '@/types';

type Props = {
    project: Project;
    statuses: WorkflowStatus[];
    members: User[];
    labels: Label[];
    priorityOptions: Option[];
    trigger?: React.ReactNode;
};

export function CreateTaskDialog({
    project,
    statuses,
    members,
    labels,
    priorityOptions,
    trigger,
}: Props) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        title: '',
        description: '',
        status_id: String(statuses[0]?.id ?? ''),
        priority: 'none',
        start_date: '',
        due_date: '',
        assignee_ids: [] as number[],
        label_ids: [] as number[],
    });

    const toggle = (key: 'assignee_ids' | 'label_ids', id: number) => {
        const values = form.data[key];
        form.setData(
            key,
            values.includes(id)
                ? values.filter((value) => value !== id)
                : [...values, id],
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            status_id: Number(data.status_id),
            start_date: data.start_date || null,
            due_date: data.due_date || null,
        }));
        form.post(`/projects/${project.key}/tasks`, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                form.setData('status_id', String(statuses[0]?.id ?? ''));
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button size="sm" className="h-8">
                        <Plus className="size-3.5" />
                        Buat tugas
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
                <DialogHeader>
                    <DialogTitle>Buat tugas</DialogTitle>
                    <DialogDescription>
                        Tambahkan tugas ke {project.name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="grid gap-4">
                    <div className="grid gap-1.5">
                        <FieldLabel htmlFor="task-title">
                            Judul tugas
                        </FieldLabel>
                        <Input
                            id="task-title"
                            autoFocus
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            placeholder="Apa yang perlu dikerjakan?"
                        />
                        {form.errors.title && (
                            <p className="text-destructive text-xs">
                                {form.errors.title}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-1.5">
                        <FieldLabel htmlFor="task-description">
                            Deskripsi
                        </FieldLabel>
                        <textarea
                            id="task-description"
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            className="bg-background min-h-24 rounded-md border px-3 py-2 text-sm"
                            placeholder="Tambahkan konteks, catatan, atau tautan yang diperlukan…"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <FieldLabel>Status</FieldLabel>
                            <Select
                                value={form.data.status_id}
                                onValueChange={(value) =>
                                    form.setData('status_id', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((status) => (
                                        <SelectItem
                                            key={status.id}
                                            value={String(status.id)}
                                        >
                                            <span
                                                className="size-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        status.color,
                                                }}
                                            />
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <FieldLabel>Prioritas</FieldLabel>
                            <Select
                                value={form.data.priority}
                                onValueChange={(value) =>
                                    form.setData('priority', value)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {priorityOptions.map((option) => (
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
                        <div className="grid gap-1.5">
                            <FieldLabel htmlFor="task-start">
                                Tanggal mulai
                            </FieldLabel>
                            <Input
                                id="task-start"
                                type="date"
                                value={form.data.start_date}
                                onChange={(event) =>
                                    form.setData(
                                        'start_date',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <FieldLabel htmlFor="task-due">Tenggat</FieldLabel>
                            <Input
                                id="task-due"
                                type="date"
                                value={form.data.due_date}
                                onChange={(event) =>
                                    form.setData('due_date', event.target.value)
                                }
                            />
                            {form.errors.due_date && (
                                <p className="text-destructive text-xs">
                                    {form.errors.due_date}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="grid gap-1.5">
                        <FieldLabel>Penanggung jawab</FieldLabel>
                        <div className="grid max-h-32 grid-cols-2 gap-1 overflow-y-auto rounded-md border p-2">
                            {members.map((member) => (
                                <label
                                    key={member.id}
                                    className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs"
                                >
                                    <Checkbox
                                        checked={form.data.assignee_ids.includes(
                                            member.id,
                                        )}
                                        onCheckedChange={() =>
                                            toggle('assignee_ids', member.id)
                                        }
                                    />
                                    <UserAvatar
                                        user={member}
                                        className="size-5"
                                    />
                                    <span className="truncate">
                                        {member.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {labels.length > 0 && (
                        <div className="grid gap-1.5">
                            <FieldLabel>Label</FieldLabel>
                            <div className="flex flex-wrap gap-1.5 rounded-md border p-2">
                                {labels.map((label) => (
                                    <label
                                        key={label.id}
                                        className="hover:bg-muted flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-1 text-xs"
                                    >
                                        <Checkbox
                                            checked={form.data.label_ids.includes(
                                                label.id,
                                            )}
                                            onCheckedChange={() =>
                                                toggle('label_ids', label.id)
                                            }
                                        />
                                        <span
                                            className="size-2 rounded-full"
                                            style={{
                                                backgroundColor: label.color,
                                            }}
                                        />
                                        {label.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={
                                form.processing || !form.data.title.trim()
                            }
                        >
                            {form.processing && <Spinner />}Buat tugas
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
