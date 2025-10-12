import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import prisma from '@/lib/prisma';
import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

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
  return (
    <Container pathname={`/albums/:id`}>
      <Suspense fallback={null}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  'use cache: remote';

  const { id } = await params;
  cacheTag(`album_${id}`);

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
  );
}
