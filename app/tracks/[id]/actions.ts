'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';

export const createTrackView = async (formData: FormData) => {
  const trackId = formData.get('trackId');
  if (!trackId) return;

  const session = await auth();

  if (!session?.user?.id) return;

  await prisma.trackView.create({
    data: {
      trackId: trackId as string,
      userId: session.user.id,
    },
  });
};

export const revalidateTrack = async (formData: FormData) => {
  const trackId = formData.get('trackId');
  if (!trackId) return;

  revalidateTag(`track_${trackId}`);
  revalidatePath(`/tracks/${trackId}`);
  redirect(`/tracks/${trackId}`);
};
