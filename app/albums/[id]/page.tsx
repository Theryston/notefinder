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
  const album = await prisma.album.findUnique({
    where: { id },
  });

  if (!album) notFound();

  return {
    title: `${album.name} - NoteFinder`,
    description: `Veja as músicas do álbum ${album.name} no NoteFinder`,
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
  });

  if (!album) notFound();

  const conditions: GetTrackCustomWhereWithCacheConditions[] = [
    { key: 'albumId', value: id },
    { key: 'completed_only' },
  ];

  const cacheTags = [`album_${id}`];

  const take = 3 * 8;
  const page = 1;

  const { tracks, total } = await getTrackCustomWhereWithCache({
    conditions,
    take,
    page,
    cacheTags,
  });

  return (
    <Container pathname={`/albums/${id}`}>
      <TrackList
        title={`Músicas do álbum ${album.name}`}
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
