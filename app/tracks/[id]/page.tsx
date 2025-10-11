import { Container } from '@/components/container';
import { getTrackCached } from '@/lib/services/track/get-track-cached';
import { notFound } from 'next/navigation';
import { ProcessingTrack } from './components/processing-track';
import { TrackContent } from './components/track-content';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { MAX_STATIC_PAGES } from '@/lib/constants';

export const dynamic = 'force-static';
export const dynamicParams = true;
export const revalidate = 10;

export async function generateStaticParams() {
  const tracks = await prisma.track.findMany({
    take: MAX_STATIC_PAGES,
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    where: { status: 'COMPLETED' },
  });

  return tracks.map((track) => ({
    id: track.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const track = await getTrackCached({ id });

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
  const { id } = await params;
  const track = await getTrackCached({ id });
  const session = await auth();

  if (!track) notFound();

  return (
    <Container pathname={`/tracks/${id}`}>
      {track.status !== 'COMPLETED' && (
        <ProcessingTrack
          id={id}
          defaultStatus={track.status}
          defaultStatusDescription={track.statusDescription || undefined}
          isCreator={session?.user?.id === track.creatorId}
        />
      )}
      {track.status === 'COMPLETED' && <TrackContent track={track} />}
    </Container>
  );
}
