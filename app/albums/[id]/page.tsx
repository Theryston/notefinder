import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import { MAX_STATIC_PAGES } from '@/lib/constants';
import prisma from '@/lib/prisma';
import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { Metadata } from 'next';
import { cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  'use cache: remote';
  const { id } = await params;
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

export async function generateStaticParams() {
  const albums = await prisma.album.findMany({
    where: { tracks: { some: { status: 'COMPLETED' } } },
    select: { id: true },
    take: MAX_STATIC_PAGES,
  });

  return albums.map((album) => ({ id: album.id }));
}
export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container pathname={`/albums/:id`}>
      <Content params={params} />
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
