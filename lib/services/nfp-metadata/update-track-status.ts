import { CompletedEmail } from '@/emails/completed-email';
import { ErrorEmail } from '@/emails/error-email';
import { TrackStatus, type Prisma } from '@/lib/generated/prisma/client';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

type UpdateTrackStatusInput = {
  trackId: string;
  status: TrackStatus;
  statusDescription?: string | null;
};

type TrackWithRelations = Prisma.TrackGetPayload<{
  include: {
    creator: true;
    trackArtists: {
      include: {
        artist: true;
      };
    };
  };
}>;

async function sendTrackCompletedEmail(track: TrackWithRelations) {
  if (!resend) {
    console.warn('[nfp-metadata] RESEND_API_KEY is missing. Skipping email.');
    return;
  }

  await resend.emails.send({
    from: 'Notefinder <noreply@notefinder.com.br>',
    to: track.creator.email,
    subject: `As notas da música ${track.title ?? ''} estão disponíveis`,
    react: CompletedEmail({ track }),
  });
}

async function sendTrackErrorEmail(track: TrackWithRelations) {
  if (!resend) {
    console.warn('[nfp-metadata] RESEND_API_KEY is missing. Skipping email.');
    return;
  }

  await resend.emails.send({
    from: 'Notefinder <noreply@notefinder.com.br>',
    to: track.creator.email,
    subject: `Hove um erro ao processar a música ${track.title ?? ''}`,
    react: ErrorEmail({ track }),
  });
}

export async function updateTrackStatus({
  trackId,
  status,
  statusDescription,
}: UpdateTrackStatusInput) {
  const currentTrack = await prisma.track.findUnique({
    where: {
      id: trackId,
    },
    include: {
      creator: true,
      trackArtists: {
        include: {
          artist: true,
        },
      },
    },
  });

  if (!currentTrack) {
    throw new Error(`[nfp-metadata] Track ${trackId} not found`);
  }

  await prisma.track.update({
    where: {
      id: trackId,
    },
    data: {
      status,
      statusDescription: statusDescription ?? null,
    },
  });

  if (currentTrack.status === status) {
    return;
  }

  if (status === TrackStatus.COMPLETED) {
    try {
      await sendTrackCompletedEmail(currentTrack);
    } catch (error) {
      console.error('[nfp-metadata] Failed to send completed email', {
        trackId,
        error,
      });
    }
  }

  if (status === TrackStatus.ERROR) {
    try {
      await sendTrackErrorEmail(currentTrack);
    } catch (error) {
      console.error('[nfp-metadata] Failed to send error email', {
        trackId,
        error,
      });
    }
  }
}
