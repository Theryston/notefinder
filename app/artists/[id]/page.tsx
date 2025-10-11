import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import prisma from '@/lib/prisma';
import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!artist) notFound();

  return {
    title: `${artist.name} - NoteFinder`,
    description: `Veja as músicas do artista ${artist.name} no NoteFinder`,
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!artist) notFound();

  const conditions: GetTrackCustomWhereWithCacheConditions[] = [
    { key: 'artistId', value: id },
    { key: 'completed_only' },
  ];

  const cacheTags = [`artist_${id}`];

  const take = 3 * 8;
  const page = 1;

  const { tracks, total } = await getTrackCustomWhereWithCache({
    conditions,
    take,
    page,
    cacheTags,
  });

  return (
    <Container pathname={`/artists/${id}`}>
      <TrackList
        title={`Músicas de ${artist.name}`}
        tracks={tracks.map(dbTrackToTrackItem)}
        pagination={{
          total,
          conditions,
          page,
          take,
          cacheTags,
        }}
      />
    </Container>
  );
}
