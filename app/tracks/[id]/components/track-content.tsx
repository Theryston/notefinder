import { getTrackCached } from '@/lib/services/track/get-track-cached';
import { notFound } from 'next/navigation';
import { AddView } from './add-view';

type Track = Awaited<ReturnType<typeof getTrackCached>>;

export async function TrackContent({ track }: { track: Track }) {
  if (!track) notFound();

  return (
    <div>
      <AddView trackId={track.id} />
      <h1>{track.title}</h1>
    </div>
  );
}
