import { cn, getFullHeight } from '@/lib/utils';
import { NotefinderYtmusicSearchResponse } from '@/lib/services/notefinder-ytmusic/types';
import { Artist, Track } from '@prisma/client';
import { notefinderYtmusicSearch } from '@/lib/services/notefinder-ytmusic/ytmusic-search';
import prisma from '@/lib/prisma';
import { CustomTrackItem } from './custom-track-item';
import { unstable_cache as cache } from 'next/cache';

export async function SearchContent({ query }: { query: string }) {
  let tracks: (NotefinderYtmusicSearchResponse & {
    existingTrack?: Track & { artists: Artist[] };
  })[] = [];

  if (query.length > 0) {
    const getExternalTracks = cache(
      async (q: string) =>
        notefinderYtmusicSearch({
          query: q,
          limit: 30,
        }),
      [query],
      {
        revalidate: false,
        tags: [`search_${query}`],
      },
    );

    const externalTracks = await getExternalTracks(query);

    const videoIds = externalTracks.map((track) => track.videoId);

    const getExistingTracks = cache(
      async (vids: string[]) =>
        prisma.track.findMany({
          where: {
            ytId: { in: vids },
          },
          include: {
            trackArtists: {
              include: {
                artist: true,
              },
            },
          },
        }),
      ['existing_tracks', ...videoIds.sort()],
      {
        revalidate: false,
        tags: videoIds.map((id) => `track_${id}`),
      },
    );

    const alreadyExists = await getExistingTracks(videoIds);

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
          Nenhuma música encontrada.
        </p>
      )}

      {!hasTracks && query.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Digite algo para buscar músicas.
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
