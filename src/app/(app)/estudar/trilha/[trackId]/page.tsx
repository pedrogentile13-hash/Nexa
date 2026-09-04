import { notFound } from 'next/navigation';
import { TrackView } from '@/features/study/components/track-view';
import { getTrack } from '@/features/study/server/queries';

export default async function TrackPage({ params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const track = await getTrack(trackId);
  if (!track) notFound();

  return <TrackView track={track} />;
}
