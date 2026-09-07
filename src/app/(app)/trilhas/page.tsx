import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Route } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ComingSoon } from '@/components/layout/coming-soon';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Trilhas',
  description: 'Percursos de estudo completos, organizados por objetivo.',
};

export const dynamic = 'force-dynamic';

export default async function TrilhasPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <AppHeader title="Trilhas" subtitle="Percursos de estudo por objetivo" />
      <PageMain className="pt-4">
        <ComingSoon
          Icon={Route}
          title="Trilhas ganha uma seção própria"
          description="Em breve: navegue trilhas por categoria (ENEM, Fundamental, Reforço, Carreiras, Habilidades), veja seu progresso e continue de onde parou — as trilhas que você já começou continuam acessíveis em Biblioteca enquanto isso."
          items={[
            'Trilhas em destaque e recomendadas para você',
            'Progresso agregado entre todas as suas trilhas',
            'Continue de onde parou, sem precisar procurar',
          ]}
        />
      </PageMain>
    </>
  );
}
