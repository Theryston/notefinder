import { cn, getFullHeight } from '@/lib/utils';
import { NotefinderYtmusicSearchResponse } from '@/lib/services/notefinder-ytmusic/types';
import { Artist, Track } from '@prisma/client';
import { notefinderYtmusicSearch } from '@/lib/services/notefinder-ytmusic/ytmusic-search';
import { CustomTrackItem } from './custom-track-item';
import { getTracksByVideoIds } from '@/lib/services/track/get-track-cached';

export async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';

  let tracks: (NotefinderYtmusicSearchResponse & {
    existingTrack?: Track & { artists: Artist[] };
  })[] = [];

  if (query.length > 0) {
    const externalTracks = await notefinderYtmusicSearch({
      query: query,
      limit: 30,
    });

    const videoIds = externalTracks.map((track) => track.videoId);

    const alreadyExists = await getTracksByVideoIds(videoIds);

    tracks = externalTracks.map((track) => {
      const existingTrack = alreadyExists.find((t) => t.ytId === track.videoId);

      return {
        ...track,
        existingTrack: existingTrack
          ? ({
              ...existingTrack,
              artists: existingTrack.trackArtists.map((t) => t.artist),
            } as Track & { artists: Artist[] })
          : undefined,
      };
    });
  }

  const hasTracks = tracks.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        !hasTracks && `h-[${getFullHeight()}] justify-center items-center`,
      )}
    >
      {!hasTracks && query.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Nenhuma música encontrada 🥲
        </p>
      )}

      {!hasTracks && query.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Digite algo para buscar a música 😤
        </p>
      )}

      {hasTracks && (
        <div className="w-full h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full h-full">
            {tracks.map((t) => (
              <CustomTrackItem
                key={`${t.artists[0].name}-${t.title}`}
                track={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
