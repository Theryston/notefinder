import { notFound } from 'next/navigation';
import { AddView } from './add-view';
import { TrackOverview } from './track-overview';
import { Timeline } from '@/components/timeline';
import { CalculateScore } from './calculate-score';
import { FullTrack } from '@/lib/constants';

export async function TrackContent({ track }: { track: FullTrack }) {
  if (!track) notFound();

  return (
    <div className="flex flex-col gap-4">
      <CalculateScore trackId={track.id} />
      <AddView trackId={track.id} />
      <TrackOverview track={track} />
      <Timeline track={track} />
    </div>
  );
}
