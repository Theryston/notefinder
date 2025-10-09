'use server';

import { type NotefinderWorkerYtmusicSearchResponse } from '@/lib/services/notefinder-worker/types';
import prisma from '@/lib/prisma';
import { addNotesQueue } from '@/lib/services/notefinder-worker/queues';
import { redirect } from 'next/navigation';
import { Artist, Track } from '@prisma/client';
import { auth } from '@/auth';
import { isNextRedirectError } from '@/lib/utils';
import { revalidateTag } from 'next/cache';

export type AddNotesState = {
  error?: { videoId?: string[] };
  values?: { videoId?: string };
};

export const onAddNotes = async (
  _prevState: unknown,
  formData: FormData,
): Promise<AddNotesState> => {
  const externalTrackString = formData.get('externalTrack')
    ? String(formData.get('externalTrack'))
    : null;

  if (!externalTrackString) {
    return {
      error: { videoId: ['Erro interno, tente novamente mais tarde'] },
      values: { videoId: '' },
    };
  }

  const externalTrack = JSON.parse(externalTrackString);

  const videoId = externalTrack.videoId;

  const session = await auth();

  if (!session?.user) redirect('/sign-in?redirectTo=/search?q=' + videoId);

  try {
    const alreadyExists = await prisma.track.findFirst({
      where: {
        ytId: externalTrack.videoId,
      },
    });

    if (alreadyExists) {
      return {
        error: { videoId: ['Esta música já existe no nosso catálogo'] },
        values: { videoId },
      };
    }

    let album = await prisma.album.findFirst({
      where: {
        ytId: externalTrack.album.id,
      },
    });

    if (!album) {
      album = await prisma.album.create({
        data: {
          ytId: externalTrack.album.id,
          name: externalTrack.album.name,
        },
      });
    }

    const artists = await prisma.artist.findMany({
      where: {
        ytId: {
          in: externalTrack.artists.map((artist: { id: string }) => artist.id),
        },
      },
    });

    const fullArtists = [];

    for (const artist of externalTrack.artists) {
      let existingArtist = artists.find((a) => a.ytId === artist.id);

      if (!existingArtist) {
        existingArtist = await prisma.artist.create({
          data: {
            ytId: artist.id,
            name: artist.name,
          },
        });
      }

      fullArtists.push(existingArtist);
    }

    const track = await prisma.track.create({
      data: {
        creator: { connect: { id: session.user.id } },
        status: 'QUEUED',
        ytId: externalTrack.videoId,
        title: externalTrack.title,
        year: isNaN(Number(externalTrack.year))
          ? null
          : Number(externalTrack.year),
        duration: externalTrack.duration,
        durationSeconds: externalTrack.duration_seconds,
        isExplicit: externalTrack.isExplicit,
        album: {
          connect: { id: album.id },
        },
        trackArtists: {
          create: fullArtists.map((artist) => ({
            artist: { connect: { id: artist.id } },
          })),
        },
      },
    });

    const job = await addNotesQueue.add('add-notes', { track, externalTrack });

    if (job?.id) {
      await prisma.track.update({
        where: { id: track.id },
        data: { jobId: job.id },
      });
    }

    revalidateTag(track.ytId);
    redirect(`/tracks/${track.id}?just-created=true`);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error(error);
    return {
      error: { videoId: ['Não foi possível adicionar a música ao catálogo'] },
      values: { videoId },
    };
  }
};

export type SearchTracksState = {
  error?: { track?: string[] };
  values?: { track?: string };
  tracks?: (NotefinderWorkerYtmusicSearchResponse & {
    existingTrack?: Track & { artists: Artist[] };
  })[];
};
