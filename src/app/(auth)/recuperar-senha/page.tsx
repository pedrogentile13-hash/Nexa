import type { Metadata } from 'next';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { RecoverForm } from '@/features/auth/components/recover-form';

export const metadata: Metadata = {
  title: 'Recuperar senha',
  description: 'Receba um link para escolher uma senha nova.',
};

export default function RecoverPage() {
  return (
    <AuthShell
      title="Esqueci minha senha"
      description="Informe o e-mail da sua conta. Enviamos um link para você escolher uma senha nova."
      backHref="/login"
    >
      <RecoverForm />
    </AuthShell>
  );
}
