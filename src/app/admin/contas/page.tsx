import { AdminHeader } from '@/features/admin/components/admin-shell';
import { AccountsManager } from '@/features/school-accounts/components/accounts-manager';
import { listSchoolAccounts } from '@/features/school-accounts/server/queries';
import { listClasses, listSchools } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Contas da escola' };

export default async function SchoolAccountsPage() {
  const identity = await requireAdmin();
  const [accounts, classes, schools] = await Promise.all([
    listSchoolAccounts(),
    listClasses(),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  // A criação de coordenação/direção exige nível de direção (ou a plataforma).
  let canCreateStaff = identity.isGlobal;
  if (!canCreateStaff && identity.schoolId) {
    const supabase = await createClient();
    const { data: level } = await supabase.rpc('school_staff_level', { p_school_id: identity.schoolId });
    canCreateStaff = (level ?? 0) >= 3;
  }

  return (
    <>
      <AdminHeader
        title="Contas da escola"
        description="Crie o login e a senha de cada aluno e professor. A senha é aleatória e aparece uma única vez; quem perder pede uma nova aqui."
      />
      <div className="p-5">
        <AccountsManager accounts={accounts} classes={classes} schools={schools} isGlobal={identity.isGlobal}
          canCreateStaff={canCreateStaff}
        />
      </div>
    </>
  );
}
