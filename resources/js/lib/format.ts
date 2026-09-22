export function formatDate(
    date: string | null,
    options?: Intl.DateTimeFormatOptions,
) {
    if (!date) return '—';
    const parsed = new Date(date.length === 10 ? `${date}T00:00:00` : date);
    return new Intl.DateTimeFormat(
        'id-ID',
        options ?? { day: '2-digit', month: 'short', year: 'numeric' },
    ).format(parsed);
}

export function relativeTime(date: string) {
    const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
    const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['year', 31_536_000],
        ['month', 2_592_000],
        ['week', 604_800],
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
    ];
    for (const [unit, amount] of ranges) {
        if (Math.abs(seconds) >= amount)
            return formatter.format(Math.round(seconds / amount), unit);
    }
    return 'baru saja';
}

export function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
