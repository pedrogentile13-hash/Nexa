import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { PopEmptyState } from '@/components/ui/empty-state';
import { School } from 'lucide-react';
import { getRankingPage, type RankingOrderBy, type RankingPeriod, type RankingScope } from '@/features/ranking/server/queries';
import { RankingView } from '@/features/ranking/components/ranking-view';
import { listSchoolClasses } from '@/features/classes/server/queries';
import { createClient, getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Ranking',
  description: 'Veja quem mais evoluiu na sua escola.',
};

export const dynamic = 'force-dynamic';

const SCOPES: RankingScope[] = ['escola', 'turma'];
const PERIODS: RankingPeriod[] = ['hoje', 'semana', 'mes', 'geral'];
const ORDERS: RankingOrderBy[] = ['xp', 'streak', 'questoes', 'horas'];

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ escopo?: string; turma?: string; periodo?: string; ordenar?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const params = await searchParams;
  const scope = SCOPES.includes(params.escopo as RankingScope)
    ? (params.escopo as RankingScope)
    : 'escola';
  const period = PERIODS.includes(params.periodo as RankingPeriod)
    ? (params.periodo as RankingPeriod)
    : 'geral';
  const orderBy = ORDERS.includes(params.ordenar as RankingOrderBy)
    ? (params.ordenar as RankingOrderBy)
    : 'xp';
  const classId = params.turma ?? null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .maybeSingle();

  const [data, classes] = await Promise.all([
    getRankingPage({ scope, classId, period, orderBy }),
    profile?.school_id ? listSchoolClasses(profile.school_id) : Promise.resolve([]),
  ]);

  return (
    <>
      <AppHeader title="Ranking" subtitle="Veja quem mais evoluiu na sua escola." />
      <PageMain>
        {!data || !data.hasSchool ? (
          <div className="pt-6">
            <PopEmptyState
              icon={<School className="text-white" />}
              title="Sem escola vinculada"
              description="O ranking compara alunos da mesma escola — vincule uma no seu perfil pra aparecer aqui."
            />
          </div>
        ) : (
          <RankingView
            data={data}
            scope={scope}
            period={period}
            orderBy={orderBy}
            classId={classId}
            classes={classes}
          />
        )}
      </PageMain>
    </>
  );
}
