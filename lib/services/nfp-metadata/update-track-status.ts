import {
  Track,
  TrackStatus,
  type Prisma,
} from '@/lib/generated/prisma/client';
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

function buildCompletedEmailHtml(track: Track) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const title = track.title ?? 'musica';

  return `
    <div style="background-color:#f0f0f0;padding:20px;border-radius:10px;">
      <h1 style="color:#333;font-size:20px;font-weight:bold;">
        As notas da musica ${title} estao disponiveis
      </h1>
      <p style="color:#333;font-size:16px;">
        Clique no link abaixo para ver as notas.
      </p>
      <a href="${appUrl}/tracks/${track.id}" style="color:#333;font-size:16px;text-decoration:underline;">
        Ver notas
      </a>
    </div>
  `;
}

function buildErrorEmailHtml(track: Track) {
  const title = track.title ?? 'musica';

  return `
    <div style="background-color:#f0f0f0;padding:20px;border-radius:10px;">
      <h1 style="color:#333;font-size:20px;font-weight:bold;">
        Houve um erro ao processar a musica ${title}
      </h1>
      <p style="color:#333;font-size:16px;">
        Entre em contato com o suporte para receber ajuda.
      </p>
    </div>
  `;
}

async function sendTrackCompletedEmail(track: TrackWithRelations) {
  if (!resend) {
    console.warn('[nfp-metadata] RESEND_API_KEY is missing. Skipping email.');
    return;
  }

  await resend.emails.send({
    from: 'Notefinder <noreply@notefinder.com.br>',
    to: track.creator.email,
    subject: `As notas da musica ${track.title ?? 'musica'} estao disponiveis`,
    html: buildCompletedEmailHtml(track),
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
    subject: `Houve um erro ao processar a musica ${track.title ?? 'musica'}`,
    html: buildErrorEmailHtml(track),
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
