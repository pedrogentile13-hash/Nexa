import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = {
  title: 'Agenda',
  description: 'Provas, entregas e estudos das próximas semanas.',
};

export default function AgendaPage() {
  return (
    <>
      <AppHeader title="Agenda" subtitle="O que vem pela frente" />
      <main className="mx-auto w-full max-w-2xl px-4 pb-6">
        <ComingSoon
          Icon={CalendarDays}
          title="Agenda chega na Etapa 5"
          description="Os dados já existem — provas, entregas, lições e sessões de estudo. Falta a visualização."
          items={[
            'Calendário mensal e semanal',
            'Lista contínua com agrupamento por dia',
            'Grade horária das aulas',
            'Criar evento em um toque',
          ]}
        />
      </main>
    </>
  );
}
