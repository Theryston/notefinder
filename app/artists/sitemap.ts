import prisma from '@/lib/prisma';
import { MAX_SITEMAP_SIZE } from '@/lib/constants';
import { MetadataRoute } from 'next';

export async function generateSitemaps() {
  const total = await prisma.artist.count({
    where: {
      trackArtists: { some: { track: { status: 'COMPLETED' } } },
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
  id: idParam,
}: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await idParam;
  const start = id * MAX_SITEMAP_SIZE;
  const end = start + MAX_SITEMAP_SIZE;

  const artists = await prisma.artist.findMany({
    skip: start,
    take: end - start,
    orderBy: { createdAt: 'desc' },
    where: {
      trackArtists: { some: { track: { status: 'COMPLETED' } } },
    },
  });

  return artists.map((artist) => ({
    url: `${process.env.NEXT_PUBLIC_APP_URL}/artists/${artist.id}`,
    lastModified: artist.updatedAt,
    changeFrequency: 'daily',
    priority: 1,
  }));
}
