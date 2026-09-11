import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import prisma from '@/lib/prisma';
import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { Metadata } from 'next';
import { cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { PageLoading } from '@/components/page-loading';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return getAlbumMetadata(id);
}

async function getAlbumMetadata(id: string): Promise<Metadata> {
  'use cache: remote';
  cacheTag(`album_${id}_metadata`);

  const album = await prisma.album.findUnique({
    where: { id },
    select: { name: true, tracks: { select: { id: true } } },
  });

  if (!album) notFound();

  return {
    title: `Músicas do álbum ${album.name} com suas notas vocais`,
    description: `Veja as músicas do álbum ${album.name} no NoteFinder e as notas vocais de cada música para nunca desafinar ao cantar!`,
    openGraph: {
      type: 'music.album',
      songs:
        album.tracks.length > 0
          ? album.tracks.map(
              (track) =>
                `${process.env.NEXT_PUBLIC_APP_URL}/tracks/${track.id}`,
            )
          : undefined,
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/albums/${id}`,
    },
  };
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container pathname={`/albums/:id`}>
      <Suspense fallback={<PageLoading label="Carregando álbum..." />}>
        <Content params={params} />
      </Suspense>
    </Container>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CachedContent id={id} />;
}

async function CachedContent({ id }: { id: string }) {
  'use cache: remote';
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
