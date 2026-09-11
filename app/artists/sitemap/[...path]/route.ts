import prisma from '@/lib/prisma';
import { MAX_SITEMAP_SIZE } from '@/lib/constants';
import {
  getAppUrl,
  parseSitemapPartId,
  sitemapResponse,
} from '@/lib/sitemap-xml';
import { connection } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  await connection();

  const path = (await params).path;
  const id = path.length === 1 ? parseSitemapPartId(path[0]) : null;
  if (id === null) return new Response('Invalid sitemap part', { status: 400 });

  const start = id * MAX_SITEMAP_SIZE;
  const artists = await prisma.artist.findMany({
    skip: start,
    take: MAX_SITEMAP_SIZE,
    orderBy: { createdAt: 'desc' },
    where: {
      trackArtists: { some: { track: { status: 'COMPLETED' } } },
    },
  });

  const appUrl = getAppUrl();

  return sitemapResponse(
    artists.map((artist) => ({
      url: `${appUrl}/artists/${artist.id}`,
      lastModified: artist.updatedAt,
      changeFrequency: 'daily',
      priority: 1,
    })),
  );
}
