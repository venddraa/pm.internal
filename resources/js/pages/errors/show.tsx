import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Home } from 'lucide-react';
import { BrandLogo } from '@/components/app/brand-logo';
import { Button } from '@/components/ui/button';

const copy: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Akses ditolak',
        description:
            'Kamu tidak memiliki izin untuk mengakses proyek atau melakukan tindakan ini.',
    },
    404: {
        title: 'Halaman tidak ditemukan',
        description:
            'Halaman mungkin telah dipindahkan, diarsipkan, atau tidak tersedia.',
    },
    419: {
        title: 'Sesi berakhir',
        description:
            'Sesi amanmu telah berakhir. Muat ulang halaman dan masuk kembali.',
    },
    422: {
        title: 'Permintaan tidak dapat diproses',
        description:
            'Beberapa informasi tidak valid. Kembali dan periksa kembali formulir.',
    },
    500: {
        title: 'Terjadi kesalahan',
        description:
            'Aplikasi mengalami kesalahan yang tidak terduga. Silakan hubungi administrator.',
    },
    503: {
        title: 'Sementara tidak tersedia',
        description:
            'Saya Akan Monitor sedang dalam pemeliharaan. Silakan coba kembali nanti.',
    },
};

export default function ErrorPage({ status }: { status: number }) {
    const message = copy[status] ?? copy[500];

    return (
        <main className="bg-muted/30 flex min-h-screen items-center justify-center px-5 py-10">
            <Head title={`${status} · ${message.title}`} />
            <section className="bg-card border-border/60 w-full max-w-lg overflow-hidden rounded-2xl border shadow-sm">
                <div className="border-b px-6 py-4">
                    <BrandLogo className="h-7 w-auto" />
                    <p className="text-muted-foreground mt-2 text-xs font-medium">
                        Saya Akan Monitor
                    </p>
                </div>
                <div className="px-6 py-10">
                    <p className="text-primary font-mono text-xs font-semibold">
                        KESALAHAN {status}
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        {message.title}
                    </h1>
                    <p className="text-muted-foreground mt-3 max-w-md text-sm leading-6">
                        {message.description}
                    </p>
                    <div className="mt-7 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="size-3.5" />
                            Kembali
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/home">
                                <Home className="size-3.5" />
                                Beranda
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}
