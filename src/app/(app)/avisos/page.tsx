import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PageMain } from '@/components/layout/page-main';
import { AnnouncementCard } from '@/features/announcements/components/announcement-card';
import { listAnnouncements } from '@/features/announcements/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Avisos da escola',
  description: 'Os avisos oficiais da sua escola e da sua turma.',
};

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const announcements = await listAnnouncements();
  const unread = announcements.filter((a) => !a.isRead).length;

  return (
    <>
      <AppHeader
        title="Avisos"
        subtitle={unread > 0 ? `${unread} ${unread === 1 ? 'novo' : 'novos'}` : 'Tudo em dia'}
      />
      <PageMain className="pt-4 md:pt-6">
        {announcements.length === 0 ? (
          <div className="border-border bg-surface rounded-2xl border p-8 text-center">
            <Megaphone className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhum aviso por enquanto</p>
            <p className="text-muted mt-1 text-sm">Quando a escola ou um professor publicar, aparece aqui e no sino.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </PageMain>
    </>
  );
}
