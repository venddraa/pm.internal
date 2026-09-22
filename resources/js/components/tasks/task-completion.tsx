import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task } from '@/types';

export function TaskCompletion({
    task,
    targetStatusId = task.completion_status_id,
}: {
    task: Task;
    targetStatusId?: number | null;
}) {
    const [saving, setSaving] = useState(false);
    const done = task.status.category === 'done';
    return (
        <Checkbox
            checked={done}
            disabled={!targetStatusId || saving}
            className="border-muted-foreground/70 size-5 shrink-0 rounded-[6px] border-2 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:text-white"
            aria-label={`${done ? 'Buka kembali' : 'Selesaikan'} ${task.reference}`}
            onCheckedChange={() => {
                if (!targetStatusId || saving) return;
                setSaving(true);
                router.patch(
                    `/projects/${task.project.key}/tasks/${task.task_number}`,
                    { status_id: targetStatusId },
                    {
                        preserveScroll: true,
                        preserveState: true,
                        onFinish: () => setSaving(false),
                    },
                );
            }}
        />
    );
}
