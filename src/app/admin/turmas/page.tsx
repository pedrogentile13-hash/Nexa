import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ClassManager } from '@/features/admin/components/class-manager';
import { listClasses, listSchools } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Turmas' };

export default async function ClassesPage() {
  const identity = await requireAdmin();
  const [classes, schools] = await Promise.all([
    listClasses(),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminHeader
        title="Turmas"
        description="Cadastre as turmas de cada escola — é essa lista que o aluno escolhe no Perfil."
      />
      <div className="p-5">
        <ClassManager classes={classes} schools={schools} isGlobal={identity.isGlobal} />
      </div>
    </>
  );
}
