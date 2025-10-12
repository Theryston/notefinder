import { Container } from '@/components/container';
import { notFound } from 'next/navigation';
import { ProcessingTrack } from './components/processing-track';
import { TrackContent } from './components/track-content';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { FULL_TRACK_INCLUDE, FullTrack } from '@/lib/constants';
import { Suspense } from 'react';
import prisma from '@/lib/prisma';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const track = await prisma.track.findFirst({
    where: { id },
    include: FULL_TRACK_INCLUDE,
  });

  if (!track) notFound();

  return {
    title: `Veja as notas vocais da música ${track.title}`,
    description: `Mais de ${track.notes.length} notas vocais para cantar ${track.title} e não desafinar na frente dos amigos!`,
    openGraph:
      track.thumbnails.length > 0
        ? {
            images: track.thumbnails.map((thumbnail) => ({
              url: thumbnail.url,
              width: thumbnail.width,
              height: thumbnail.height,
            })),
          }
        : undefined,
  };
}

export default async function Track({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container pathname="/tracks/:id">
      <Suspense fallback={null}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  'use cache: remote';

  const { id } = await params;

  cacheTag(`track_${id}`);

  const track = await prisma.track.findFirst({
    where: { id },
    include: FULL_TRACK_INCLUDE,
  });

  if (!track) notFound();

  return (
    <>
      {track.status !== 'COMPLETED' && (
        <ProcessingTrack
          id={id}
          defaultStatus={track.status}
          defaultStatusDescription={track.statusDescription || undefined}
          creatorId={track.creatorId}
        />
      )}

      {track.status === 'COMPLETED' && (
        <TrackContent track={track as unknown as FullTrack} />
      )}
    </>
  );
}
