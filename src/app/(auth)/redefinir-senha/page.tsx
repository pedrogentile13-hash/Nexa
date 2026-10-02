import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { NewPasswordForm } from '@/features/auth/components/new-password-form';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Nova senha',
  robots: { index: false },
};

export default async function ResetPasswordPage() {
  // Só chega aqui quem veio do link do e-mail — ele cria a sessão de
  // recuperação. Sem sessão não há o que redefinir, e deixar o formulário
  // aberto faria o aluno digitar uma senha nova para receber um erro no fim.
  const user = await getCurrentUser();
  if (!user) redirect('/recuperar-senha');

  return (
    <AuthShell
      title="Escolha uma senha nova"
      description="Ela substitui a anterior em todos os seus aparelhos."
    >
      <NewPasswordForm />
    </AuthShell>
  );
}
