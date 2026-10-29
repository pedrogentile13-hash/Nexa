import { AdminHeader } from '@/features/admin/components/admin-shell';
import { SchoolEventManager } from '@/features/admin/components/school-event-manager';
import { listClasses, listSchools } from '@/features/admin/server/queries';
import { requireAccess } from '@/features/admin/server/guard';
import { listEvents } from '@/features/community/server/event-queries';

export const metadata = { title: 'Eventos' };

export default async function SchoolEventsPage() {
  const identity = await requireAccess('/admin/eventos');
  const [events, classes, schools] = await Promise.all([
    listEvents(false),
    listClasses(),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminHeader
        title="Eventos"
        description="Eventos oficiais da escola: provas, reuniões, passeios. Só a escola cria — as comunidades continuam livres, mas não publicam evento."
      />
      <div className="p-5">
        <SchoolEventManager events={events} classes={classes} schools={schools} isGlobal={identity.isGlobal} />
      </div>
    </>
  );
}
