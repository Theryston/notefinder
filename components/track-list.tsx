import { Track, TrackItem } from './track-item';

export function TrackList({
  tracks,
  title,
  customAction,
}: {
  tracks: Track[];
  title?: string;
  customAction?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {title && <h2 className="text-xl font-bold">{title}</h2>}
        {customAction}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <TrackItem
            key={track.videoId}
            track={track}
            href={`/tracks/${track.id}`}
          />
        ))}
      </div>
    </div>
  );
}
