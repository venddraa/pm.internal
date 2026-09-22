import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

const avatarColors = [
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
];

function colorFor(name: string) {
    const hash = Array.from(name).reduce(
        (total, char) => total + char.charCodeAt(0),
        0,
    );
    return avatarColors[hash % avatarColors.length];
}

export function UserAvatar({
    user,
    className,
}: {
    user: User;
    className?: string;
}) {
    return (
        <Avatar
            className={cn('border-background size-6 border', className)}
            title={user.name}
        >
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
            <AvatarFallback
                className={cn('text-[10px] font-semibold', colorFor(user.name))}
            >
                {user.initials}
            </AvatarFallback>
        </Avatar>
    );
}

export function AvatarStack({
    users,
    limit = 3,
}: {
    users: User[];
    limit?: number;
}) {
    if (users.length === 0) {
        return (
            <span className="text-muted-foreground text-xs">
                Belum ditugaskan
            </span>
        );
    }

    const visible = users.slice(0, limit);
    return (
        <div
            className="flex -space-x-1.5"
            aria-label={users.map((user) => user.name).join(', ')}
        >
            {visible.map((user) => (
                <UserAvatar key={user.id} user={user} />
            ))}
            {users.length > limit && (
                <span className="border-background bg-muted text-muted-foreground relative flex size-6 items-center justify-center rounded-full border text-[10px] font-semibold">
                    +{users.length - limit}
                </span>
            )}
        </div>
    );
}
