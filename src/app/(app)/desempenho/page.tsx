import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { ComingSoon } from '@/components/layout/coming-soon';
import { Card, CardContent } from '@/components/ui/card';
import { formatGrade } from '@/features/grades';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Desempenho',
  description: 'Como você está e como está evoluindo.',
};

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const supabase = await createClient();
  const { data: currentTermId } = await supabase.rpc('current_term_id', { p_user_id: user.id });

  const { data: summary } = await supabase
    .from('v_term_summary')
    .select('*')
    .eq('term_id', (currentTermId as string) ?? '')
    .maybeSingle();

  return (
    <>
      <AppHeader title="Desempenho" subtitle={summary?.term_name ?? 'Período atual'} />

      <main className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-6">
        {/* O "como estou agora" já é calculável; a evolução vem com os gráficos. */}
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Média geral"
            value={formatGrade(summary?.average_overall ?? null, 1)}
            tone="brand"
          />
          <Stat
            label="Disciplinas"
            value={summary ? `${summary.subjects_graded}/${summary.subjects_total}` : '—'}
            hint="com nota lançada"
          />
          <Stat
            label="Abaixo da média"
            value={summary ? String(summary.subjects_below_passing) : '—'}
            tone={summary && summary.subjects_below_passing > 0 ? 'danger' : 'success'}
          />
          <Stat
            label="Por lançar"
            value={summary ? String(summary.pending_activities) : '—'}
            hint="avaliações"
          />
        </div>

        <ComingSoon
          Icon={TrendingUp}
          title="Gráficos chegam na Etapa 5"
          description="Os números acima já vêm das views de cálculo. Falta a parte visual da evolução."
          items={[
            'Evolução da média por período',
            'Comparação entre disciplinas',
            'Horas estudadas por semana',
            'Histórico entre anos letivos',
          ]}
        />
      </main>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'brand' | 'danger' | 'success';
}) {
  const toneClass = {
    neutral: 'text-text',
    brand: 'text-brand-text',
    danger: 'text-danger',
    success: 'text-success',
  }[tone];

  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-subtle text-xs">{label}</p>
        <p className={`tabular mt-1 text-2xl leading-none font-semibold ${toneClass}`}>{value}</p>
        {hint && <p className="text-subtle mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
