import { unstable_cacheTag as cacheTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { MAX_SITEMAP_SIZE } from '@/lib/constants';
import { MetadataRoute } from 'next';

export async function generateSitemaps() {
  'use cache: remote';
  cacheTag('sitemap_generate_albums');

  const total = await prisma.album.count({
    where: {
      tracks: { some: { status: 'COMPLETED' } },
    },
  });

  const pages = Math.ceil(total / MAX_SITEMAP_SIZE);

  const sitemaps = [];

  for (let i = 0; i < pages; i++) {
    sitemaps.push({ id: i });
  }

  return sitemaps;
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const start = id * MAX_SITEMAP_SIZE;
  const end = start + MAX_SITEMAP_SIZE;

  const albums = await prisma.album.findMany({
    skip: start,
    take: end - start,
    orderBy: {
      createdAt: 'desc',
    },
    where: {
      tracks: { some: { status: 'COMPLETED' } },
    },
  });

  return albums.map((album) => ({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/albums/${album.id}`,
    lastModified: album.updatedAt,
    changeFrequency: 'daily',
    priority: 1,
  }));
}
