import { PageTitle } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { requireContentManager } from '@/features/admin/server/guard';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { PlansManager } from '@/features/teacher-plans/components/plans-manager';
import { listPlans } from '@/features/teacher-plans/server/queries';

export const metadata = { title: 'Planejamento' };
export const dynamic = 'force-dynamic';

export default async function PlanejamentoPage() {
  await requireStaff('/escola/planejamento');
  const identity = await requireContentManager();
  const [plans, options] = await Promise.all([listPlans(), getResourceFormOptions(identity)]);

  return (
    <>
      <PageTitle title="Planejamento" subtitle="Guarde o que você vai ensinar. A IA cria resumo e simulado só a partir disso — tudo sai como rascunho para você revisar." />
      <PlansManager plans={plans} subjects={options.subjects.map((s) => ({ id: s.id, name: s.name }))} />
    </>
  );
}
