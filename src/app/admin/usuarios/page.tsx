import { AdminHeader } from '@/features/admin/components/admin-shell';
import { PeopleManager } from '@/features/admin/components/people-manager';
import { listPeople, listSchools } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Pessoas' };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const identity = await requireAdmin();
  const params = await searchParams;

  if (!identity.isGlobal) {
    return (
      <>
        <AdminHeader title="Pessoas" />
        <div className="p-5">
          <div className="border-border bg-surface rounded-lg border p-6 text-center">
            <p className="text-sm font-medium">Só a administração geral muda papéis.</p>
            <p className="text-muted mt-1 text-sm">
              Dar acesso de administrador é uma decisão que atravessa escolas, então ela não fica
              dentro de uma.
            </p>
          </div>
        </div>
      </>
    );
  }

  const [people, schools] = await Promise.all([listPeople(params.q), listSchools()]);

  return (
    <>
      <AdminHeader
        title="Pessoas"
        description="Quem administra o quê. Todo o resto do app continua sendo do aluno."
      />
      <div className="p-5">
        <PeopleManager
          people={people}
          schools={schools.map((s) => ({ id: s.id, name: s.name }))}
          currentUserId={identity.userId}
          search={params.q ?? ''}
        />
      </div>
    </>
  );
}
