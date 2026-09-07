import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ComingSoon } from '@/components/layout/coming-soon';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Simulados',
  description: 'Todos os simulados disponíveis e seu histórico de tentativas.',
};

export const dynamic = 'force-dynamic';

export default async function SimuladosPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <AppHeader title="Simulados" subtitle="Sua seção dedicada de simulados" />
      <PageMain className="pt-4">
        <ComingSoon
          Icon={ClipboardCheck}
          title="Simulados ganha uma seção própria"
          description="Em breve: todos os simulados disponíveis e seu histórico completo de tentativas, num só lugar — os simulados continuam funcionando normalmente em Biblioteca e Matérias enquanto isso."
          items={[
            'Lista de simulados disponíveis por matéria',
            'Histórico de tentativas com nota, acertos e tempo',
            'Acesso rápido para refazer ou ver o resultado detalhado',
          ]}
        />
      </PageMain>
    </>
  );
}
