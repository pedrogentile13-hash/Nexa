import { notFound, redirect } from 'next/navigation';
import { TrackDetailView } from '@/features/trilhas/components/track-detail-view';
import { getTrack, getTrackStats } from '@/features/trilhas/server/queries';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function TrackPage({ params }: { params: Promise<{ trackId: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { trackId } = await params;
  const track = await getTrack(trackId);
  if (!track) notFound();

  const stats = await getTrackStats(trackId, user.id);

  return <TrackDetailView track={track} stats={stats} />;
}
