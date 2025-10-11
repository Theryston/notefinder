import { Track, TrackItem } from './track-item';

export function TrackList({ tracks }: { tracks: Track[] }) {
  return (
    <div>
      {tracks.map((track) => (
        <TrackItem
          key={track.videoId}
          track={track}
          href={`/tracks/${track.id}`}
        />
      ))}
    </div>
  );
}
