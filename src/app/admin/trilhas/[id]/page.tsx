import { notFound } from 'next/navigation';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { TrackBuilder } from '@/features/admin/components/track-builder';
import { getTrackDetail } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getTrackDetail(id);

  if (!detail.track) notFound();

  const subject = detail.track.subject_catalog as unknown as { name: string } | null;

  return (
    <>
      <AdminHeader
        title={detail.track.title}
        description={`${subject?.name ?? 'Matéria'} · ${detail.lessons.length} ${detail.lessons.length === 1 ? 'lição' : 'lições'} · ${detail.track.is_published ? 'publicada' : 'rascunho'}`}
      />
      <div className="max-w-3xl p-5">
        <TrackBuilder
          trackId={detail.track.id}
          sections={detail.sections}
          lessons={detail.lessons}
          links={detail.links}
          resources={detail.resources}
        />
      </div>
    </>
  );
}
