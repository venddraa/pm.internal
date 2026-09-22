import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout';
import { useFlashToast } from '@/hooks/use-flash-toast';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: {
    title?: string;
    description?: string;
    children: React.ReactNode;
}) {
    useFlashToast();

    return (
        <AuthLayoutTemplate title={title} description={description}>
            {children}
        </AuthLayoutTemplate>
    );
}
