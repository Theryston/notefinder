import { getTrackCached } from '@/lib/services/track/get-track-cached';
import { notFound } from 'next/navigation';
import { AddView } from './add-view';
import { TrackOverview } from './track-overview';

type Track = Awaited<ReturnType<typeof getTrackCached>>;

export async function TrackContent({ track }: { track: Track }) {
  if (!track) notFound();

  return (
    <div className="flex flex-col gap-4">
      <AddView trackId={track.id} />
      <TrackOverview track={track} />
      <h1>{track.title}</h1>
    </div>
  );
}
