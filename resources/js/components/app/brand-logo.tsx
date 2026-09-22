import { cn } from '@/lib/utils';

export function BrandLogo({
    className,
    white = false,
}: {
    className?: string;
    white?: boolean;
}) {
    if (white) {
        return (
            <span
                role="img"
                aria-label="Jasa Marga"
                className={cn(
                    'inline-flex aspect-[3.1] max-w-full items-center gap-[4%]',
                    className,
                )}
            >
                <span className="sam-brand-symbol h-full w-[26%] shrink-0 bg-white" />
                <span className="sam-brand-wordmark h-full flex-1 bg-white" />
            </span>
        );
    }
    return (
        <img
            src="/brand/jasamarga-logo.png"
            alt="Jasa Marga"
            className={cn('h-auto max-w-full object-contain', className)}
        />
    );
}
