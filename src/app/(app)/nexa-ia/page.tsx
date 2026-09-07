import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { ComingSoon } from '@/components/layout/coming-soon';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Nexa IA',
  description: 'Seu assistente de estudos.',
};

export const dynamic = 'force-dynamic';

export default async function NexaIaPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <AppHeader title="Nexa IA" subtitle="Seu assistente de estudos" />
      <PageMain className="pt-4">
        <ComingSoon
          Icon={Sparkles}
          title="Nexa IA está a caminho"
          description="Em breve: um assistente que explica conteúdo, resume texto, gera questões e tira dúvidas, sempre no contexto do que você está estudando."
          items={[
            'Chat com histórico de conversas',
            'Explicações, resumos e questões sob medida',
            'Acesso direto a partir de qualquer conteúdo',
          ]}
        />
      </PageMain>
    </>
  );
}
