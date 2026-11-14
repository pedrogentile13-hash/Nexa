import { AdminHeader } from '@/features/admin/components/admin-shell';
import { AnnouncementsManager } from '@/features/announcements/components/announcements-manager';
import { listAnnouncements } from '@/features/announcements/server/queries';
import { listClasses } from '@/features/admin/server/queries';
import { requireAccess } from '@/features/admin/server/guard';

export const metadata = { title: 'Mural de avisos' };

export const dynamic = 'force-dynamic';

export default async function AdminMuralPage() {
  const identity = await requireAccess('/admin/mural');
  const [announcements, classes] = await Promise.all([listAnnouncements(), listClasses()]);

  return (
    <>
      <AdminHeader
        title="Mural de avisos"
        description="Avisos oficiais da escola. Chegam no sino de cada aluno e você vê quem confirmou a leitura — e quem ainda não."
      />
      <div className="p-5">
        {identity.isGlobal && !identity.schoolId ? (
          <p className="text-muted text-sm">
            O mural pertence a uma escola. Entre com uma conta de direção ou coordenação para publicar.
          </p>
        ) : (
          <AnnouncementsManager
            announcements={announcements}
            classes={classes.filter((c) => c.schoolId === identity.schoolId).map((c) => ({ id: c.id, name: c.name }))}
            canSchoolWide
          />
        )}
      </div>
    </>
  );
}
