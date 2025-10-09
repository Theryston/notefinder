import { Container } from '@/components/container';
import { getTrackCached } from '@/lib/services/track/get-track-cached';
import { notFound } from 'next/navigation';

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

  return <Container pathname={`/tracks/${id}`}>Track {id}</Container>;
}
