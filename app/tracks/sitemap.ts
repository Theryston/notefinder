import { unstable_cacheTag as cacheTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { MAX_SITEMAP_SIZE } from '@/lib/constants';
import { MetadataRoute } from 'next';
import { getBiggestOne } from '@/lib/utils';
import { Thumbnail, Track } from '@/lib/generated/prisma';

export async function generateSitemaps() {
  'use cache: remote';
  cacheTag('sitemap_generate_tracks');

  const total = await prisma.track.count({
    where: { status: 'COMPLETED' },
  });

  const pages = Math.ceil(total / MAX_SITEMAP_SIZE);

  const sitemaps = [];

  for (let i = 0; i < pages; i++) {
    sitemaps.push({ id: i });
  }

  return sitemaps;
}

export default async function sitemap({
  id: idParam,
}: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  'use cache: remote';
  cacheTag(`sitemap_tracks_${idParam}`);

  const id = await idParam;
  const start = id * MAX_SITEMAP_SIZE;
  const end = start + MAX_SITEMAP_SIZE;

  const tracks = await prisma.track.findMany({
    skip: start,
    take: end - start,
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    where: { status: 'COMPLETED' },
    include: { thumbnails: true },
  });

  const mappedTracks = (
    tracks as unknown as (Track & { thumbnails: Thumbnail[] })[]
  ).map((track) => {
    const biggestThumbnail = getBiggestOne(track.thumbnails, 'width');

    return {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/tracks/${track.id}`,
      lastModified: track.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 1,
      images: biggestThumbnail ? [biggestThumbnail.url] : undefined,
    };
  });

  return mappedTracks;
}
