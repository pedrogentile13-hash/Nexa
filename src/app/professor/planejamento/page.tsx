import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { PlansManager } from '@/features/teacher-plans/components/plans-manager';
import { listPlans } from '@/features/teacher-plans/server/queries';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { requireContentManager } from '@/features/admin/server/guard';

export const metadata = { title: 'Planejamento' };

export const dynamic = 'force-dynamic';

export default async function TeacherPlansPage() {
  const identity = await requireContentManager();
  const [plans, options] = await Promise.all([listPlans(), getResourceFormOptions(identity)]);

  return (
    <>
      <TeacherHeader
        title="Planejamento"
        description="Guarde o que você vai ensinar. A IA cria resumo e simulado só a partir disso, com o seu recorte — e tudo sai como rascunho para você revisar."
      />
      <div className="p-5">
        <PlansManager plans={plans} subjects={options.subjects.map((s) => ({ id: s.id, name: s.name }))} />
      </div>
    </>
  );
}
