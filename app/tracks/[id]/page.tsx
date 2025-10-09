import { Container } from '@/components/container';
import { getTrackCached } from '@/lib/services/track/get-track-cached';
import { notFound } from 'next/navigation';
import { ProcessingTrack } from './components/processing-track';
import { TrackContent } from './components/track-content';

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ 'just-created': string }>;
}) {
  const { id } = await params;
  const track = await getTrackCached({ id });
  const { 'just-created': justCreated } = await searchParams;

  if (!track) notFound();

  return (
    <Container pathname={`/tracks/${id}`}>
      {track.status !== 'COMPLETED' && (
        <ProcessingTrack
          id={id}
          defaultStatus={track.status}
          defaultStatusDescription={track.statusDescription || undefined}
          justCreated={justCreated === 'true'}
        />
      )}
      {track.status === 'COMPLETED' && <TrackContent track={track} />}
    </Container>
  );
}
