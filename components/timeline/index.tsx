import { TimelineClient } from '@/components/timeline/timeline-client';
import { FullTrack } from '@/lib/constants';

export function Timeline({ track }: { track: FullTrack }) {
  if (!track) return null;
  if (!track.notes || track.notes.length === 0) return null;
  if (!track.ytId) return null;

  return (
    <section className="w-full">
      <div className="relative overflow-hidden rounded-2xl border bg-background/60 shadow-sm backdrop-blur">
        <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-primary/10 via-transparent to-primary/10" />

        <div className="p-4 sm:p-6">
          <TimelineClient ytId={track.ytId} notes={track.notes} />
        </div>
      </div>
    </section>
  );
}
