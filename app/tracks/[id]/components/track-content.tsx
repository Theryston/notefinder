import { notFound } from 'next/navigation';
import { AddView } from './add-view';
import { TrackOverview } from './track-overview';
import { Timeline } from '@/components/timeline';
import { CalculateScore } from './calculate-score';
import { FullTrack, Lyrics } from '@/lib/constants';
import { Suspense } from 'react';
import { LyricsComponent } from './lyrics';

export async function TrackContent({
  track,
  lyrics,
}: {
  track: FullTrack;
  lyrics?: Lyrics;
}) {
  if (!track) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={null}>
        <CalculateScore trackId={track.id} />
        <AddView trackId={track.id} />
      </Suspense>
      <TrackOverview track={track} />
      <Timeline track={track} lyrics={lyrics} />
      {lyrics && <LyricsComponent lyrics={lyrics} />}
    </div>
  );
}
