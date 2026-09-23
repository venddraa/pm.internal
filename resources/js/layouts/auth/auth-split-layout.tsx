import { BrandLogo } from '@/components/app/brand-logo';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="sam-auth">
            <header className="sam-auth-brand">
                <BrandLogo white className="w-36 sm:w-44" />
            </header>
            <main className="sam-auth-main">
                <section
                    className="sam-auth-form"
                    aria-label="Masuk ke ruang kerja"
                >
                    <p className="sam-auth-eyebrow">
                        IT Planning & Governance Department
                    </p>
                    <h1 className="sam-auth-headline">
                        Saya Akan<span>Monitor!</span>
                    </h1>
                    <div className="sam-auth-fields">
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <p className="mt-2 mb-7 text-sm leading-6 text-blue-100/80">
                            {description}
                        </p>
                        {children}
                    </div>
                </section>
                <div className="sam-auth-art" aria-hidden="true">
                    <div className="sam-auth-halo" />
                    <div className="sam-brand-symbol sam-auth-symbol-shadow" />
                    <div className="sam-brand-symbol sam-auth-symbol" />
                    <div className="sam-auth-art-caption">
                        <span>Sini Kasih Apa ya</span>
                        <p>biar gak sepi</p>
                    </div>
                </div>
            </main>
            <footer className="sam-auth-footer">
                <span>PT Jasa Marga (Persero) Tbk</span>
                <span>Khusus penggunaan internal</span>
            </footer>
        </div>
    );
}
