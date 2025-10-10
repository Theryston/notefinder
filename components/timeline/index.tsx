import { getTrackCached } from '@/lib/services/track/get-track-cached';

type Track = Awaited<ReturnType<typeof getTrackCached>>;

export function Timeline({ track }: { track: Track }) {
  return <div>Timeline</div>;
}
