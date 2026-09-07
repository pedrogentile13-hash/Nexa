import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Target } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ComingSoon } from '@/components/layout/coming-soon';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Metas',
  description: 'Seus objetivos de estudo, acompanhados automaticamente.',
};

export const dynamic = 'force-dynamic';

export default async function MetasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <AppHeader title="Metas" subtitle="Seus objetivos de estudo" />
      <PageMain className="pt-4">
        <ComingSoon
          Icon={Target}
          title="Metas ganha uma seção própria"
          description="Em breve: acompanhe horas de estudo, matérias, atividades e sequência num só lugar, além de metas de longo prazo que você mesmo define — suas metas diária e semanal continuam em Perfil enquanto isso."
          items={[
            'Progresso de horas, matérias e atividades do mês',
            'Distribuição do esforço por matéria e por dia',
            'Metas de longo prazo, definidas por você',
          ]}
        />
      </PageMain>
    </>
  );
}
