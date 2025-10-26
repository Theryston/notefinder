import { TimelineClient } from '@/components/timeline/timeline-client';
import { FullTrack, Lyrics } from '@/lib/constants';
import { Suspense } from 'react';
import { Skeleton } from '../sheleton';

export function Timeline({
  track,
  lyrics,
}: {
  track: FullTrack;
  lyrics?: Lyrics;
}) {
  if (!track) return null;
  if (!track.notes || track.notes.length === 0) return null;
  if (!track.ytId) return null;

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-4 sm:p-6">
          <Suspense fallback={<TimelineFallback />}>
            <TimelineClient
              ytId={track.ytId}
              notes={track.notes}
              lyrics={lyrics}
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function TimelineFallback() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4 items-start w-full">
      <div className="w-full h-96 md:h-[80vh]">
        <Skeleton />
      </div>
      <div className="w-full h-96 hidden md:block">
        <Skeleton />
      </div>
    </div>
  );
}
