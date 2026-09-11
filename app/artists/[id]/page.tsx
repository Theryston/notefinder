import { Container } from '@/components/container';
import { TrackList } from '@/components/track-list';
import prisma from '@/lib/prisma';
import {
  getTrackCustomWhereWithCache,
  GetTrackCustomWhereWithCacheConditions,
} from '@/lib/services/track/get-track-cached';
import { dbTrackToTrackItem } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { cacheTag } from 'next/cache';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { PageLoading } from '@/components/page-loading';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return getArtistMetadata(id);
}

async function getArtistMetadata(id: string): Promise<Metadata> {
  'use cache: remote';
  cacheTag(`artist_${id}`);

  const artist = await prisma.artist.findUnique({
    where: { id },
  });

  if (!artist) notFound();

  return {
    title: `Músicas de ${artist.name} com suas notas vocais`,
    description: `Veja as músicas do artista ${artist.name} no NoteFinder e as notas vocais de cada música para nunca desafinar ao cantar!`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/artists/${id}`,
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Container pathname={`/artists/:id`}>
      <Suspense fallback={<PageLoading label="Carregando artista..." />}>
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
  cacheTag(`artist_${id}`);

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
  );
}
