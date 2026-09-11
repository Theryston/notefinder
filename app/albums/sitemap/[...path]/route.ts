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
  const albums = await prisma.album.findMany({
    skip: start,
    take: MAX_SITEMAP_SIZE,
    orderBy: { createdAt: 'desc' },
    where: {
      tracks: { some: { status: 'COMPLETED' } },
    },
  });

  const appUrl = getAppUrl();

  return sitemapResponse(
    albums.map((album) => ({
      url: `${appUrl}/albums/${album.id}`,
      lastModified: album.updatedAt,
      changeFrequency: 'daily',
      priority: 1,
    })),
  );
}
