import { Link } from '@inertiajs/react';
import type { PaginationLink } from '@/types';
import { cn } from '@/lib/utils';

export function Pagination({ links }: { links: PaginationLink[] }) {
    if (links.length <= 3) return null;
    return (
        <nav
            className="flex items-center justify-center gap-1 border-t px-4 py-3"
            aria-label="Paginasi"
        >
            {links.map((link, index) =>
                link.url ? (
                    <Link
                        key={`${link.label}-${index}`}
                        href={link.url}
                        preserveScroll
                        className={cn(
                            'text-muted-foreground hover:bg-muted hover:text-foreground min-w-8 rounded-md px-2 py-1 text-center text-xs',
                            link.active &&
                                'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ) : (
                    <span
                        key={`${link.label}-${index}`}
                        className="text-muted-foreground/50 px-2 py-1 text-xs"
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ),
            )}
        </nav>
    );
}
