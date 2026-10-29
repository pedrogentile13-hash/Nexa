import { ContasPanel } from '@/features/escola/components/contas-panel';
import { PageTitle } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { listClassCards } from '@/features/escola/server/queries';
import { ImportPanel } from '@/features/school-accounts/components/import-panel';
import { listSchoolAccounts } from '@/features/school-accounts/server/queries';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Contas' };
export const dynamic = 'force-dynamic';

export default async function ContasPage() {
  const staff = await requireStaff('/escola/contas');
  const supabase = await createClient();
  const [accounts, classes, level] = await Promise.all([
    listSchoolAccounts(),
    listClassCards(),
    staff.schoolId ? supabase.rpc('school_staff_level', { p_school_id: staff.schoolId }) : Promise.resolve({ data: 0 }),
  ]);

  return (
    <>
      <PageTitle title="Contas" subtitle="Login e senha de cada aluno e professor. As senhas são geradas pelo Nexa e ficam guardadas cifradas para você repassar." />
      <ContasPanel accounts={accounts} classes={classes.map((c) => ({ id: c.id, name: c.name }))} canCreateStaff={(level.data ?? 0) >= 3} />
      <div className="mt-6">
        <ImportPanel schools={[]} isGlobal={false} />
      </div>
    </>
  );
}
