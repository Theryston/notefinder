import { cn, getFullHeight } from '@/lib/utils';
import { NotefinderWorkerYtmusicSearchResponse } from '@/lib/services/notefinder-worker/types';
import { Artist, Track } from '@prisma/client';
import { notefinderWorkerYtmusicSearch } from '@/lib/services/notefinder-worker/ytmusic-search';
import prisma from '@/lib/prisma';
import { CustomTrackItem } from './custom-track-item';
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from 'next/cache';

export async function SearchContent({ query }: { query: string }) {
  'use cache';
  cacheLife('max');

  let tracks: (NotefinderWorkerYtmusicSearchResponse & {
    existingTrack?: Track & { artists: Artist[] };
  })[] = [];

  if (query.length > 0) {
    const externalTracks = await notefinderWorkerYtmusicSearch({
      query,
      limit: 30,
    });

    const alreadyExists = await prisma.track.findMany({
      where: {
        ytId: { in: externalTracks.map((track) => track.videoId) },
      },
      include: {
        trackArtists: {
          include: {
            artist: true,
          },
        },
      },
    });

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

  cacheTag(`search_${query}`, ...tracks.map((t) => t.videoId));

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
