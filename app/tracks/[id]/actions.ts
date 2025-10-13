'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { calculateTrackScoreJob } from '@/lib/services/track/calculate-score-job';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export const calculateTrackScore = async (trackId: string) => {
  await calculateTrackScoreJob(trackId);
};

export const createTrackView = async (formData: FormData) => {
  const trackId = formData.get('trackId');
  if (!trackId) return;

  const session = await auth();

  if (!session?.user?.id) return;

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
    },
  });

  if (!user) return;

  await prisma.trackView.create({
    data: {
      trackId: trackId as string,
      userId: session.user.id,
    },
  });
};

export const handleFavoriteTrack = async (
  prevState: { isFavorite: boolean; isLoggedIn: boolean },
  formData: FormData,
): Promise<{ isFavorite: boolean; isLoggedIn: boolean }> => {
  const trackId = formData.get('trackId');
  const ignoreAction = formData.get('ignoreAction');
  const session = await auth();

  if (!session?.user?.id) {
    return {
      isFavorite: prevState?.isFavorite,
      isLoggedIn: false,
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    return {
      isFavorite: prevState?.isFavorite,
      isLoggedIn: false,
    };
  }

  try {
    const favorite = await prisma.userFavoriteTrack.findFirst({
      where: {
        userId: session.user.id,
        trackId: trackId as string,
      },
    });

    if (ignoreAction === 'true') {
      return { isFavorite: !!favorite, isLoggedIn: true };
    }

    if (favorite) {
      await prisma.userFavoriteTrack.delete({
        where: { id: favorite.id },
      });

      revalidateTag(`user_${user.username}`);

      return {
        isFavorite: false,
        isLoggedIn: true,
      };
    } else {
      await prisma.userFavoriteTrack.create({
        data: { userId: session.user.id, trackId: trackId as string },
      });

      revalidateTag(`user_${user.username}`);

      return {
        isFavorite: true,
        isLoggedIn: true,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      isFavorite: prevState?.isFavorite,
      isLoggedIn: true,
    };
  }
};

export const revalidateTrack = async (formData: FormData) => {
  const trackId = formData.get('trackId');
  if (!trackId) return;

  const track = await prisma.track.findUnique({
    where: { id: trackId as string },
    include: {
      creator: true,
    },
  });

  if (!track) return;

  revalidateTag(`track_${trackId}`);
  revalidateTag(`user_${track.creator.username}`);
  revalidatePath(`/tracks/${trackId}`);
  redirect(`/tracks/${trackId}`);
};
