import { School } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { SchoolManager } from '@/features/admin/components/school-manager';
import { listSchools } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Escolas' };

export default async function SchoolsPage() {
  const identity = await requireAdmin();
  const schools = await listSchools();

  if (!identity.isGlobal) {
    return (
      <>
        <AdminHeader title="Escolas" />
        <div className="p-5">
          <div className="border-border bg-surface rounded-lg border p-6 text-center">
            <School className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Você administra uma escola só.</p>
            <p className="text-muted mt-1 text-sm">
              {identity.schoolName ?? 'Nenhuma escola vinculada ao seu perfil.'} — tudo o que você
              publica fica visível apenas para os alunos dela.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader
        title="Escolas"
        description="Cada escola pode ter a própria biblioteca. O que é criado sem escola fica visível para todo mundo."
      />
      <div className="p-5">
        <SchoolManager schools={schools} />
      </div>
    </>
  );
}
