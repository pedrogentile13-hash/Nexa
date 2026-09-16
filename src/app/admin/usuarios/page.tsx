import { AdminHeader } from '@/features/admin/components/admin-shell';
import { PeopleManager } from '@/features/admin/components/people-manager';
import { listPeople, listSchools } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Pessoas' };

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; school?: string }>;
}) {
  const identity = await requireAdmin();
  const params = await searchParams;

  // Admin de escola enxerga a própria lista (pra chegar no relatório dos
  // próprios alunos), mas não edita papel — dar acesso de administrador é
  // uma decisão que atravessa escolas, então ela não fica dentro de uma.
  // `?school=` (vindo de Relatórios) só vale pro admin geral: um admin de
  // escola já está limitado à própria, escolher outra não faria sentido.
  const schoolFilter = identity.isGlobal ? params.school : identity.schoolId;
  const [people, schools] = await Promise.all([
    listPeople(params.q, schoolFilter ?? undefined),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminHeader
        title="Pessoas"
        description={
          identity.isGlobal
            ? 'Quem administra o quê. Todo o resto do app continua sendo do aluno.'
            : 'Alunos e admins da sua escola. Só a administração geral muda papéis.'
        }
      />
      <div className="p-5">
        <PeopleManager
          people={people}
          schools={schools.map((s) => ({ id: s.id, name: s.name }))}
          currentUserId={identity.userId}
          search={params.q ?? ''}
          readOnly={!identity.isGlobal}
        />
      </div>
    </>
  );
}
