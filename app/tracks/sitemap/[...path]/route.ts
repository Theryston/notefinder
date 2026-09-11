import { MAX_SITEMAP_SIZE } from '@/lib/constants';
import prisma from '@/lib/prisma';
import { getBiggestOne } from '@/lib/utils';
import { Thumbnail, Track } from '@/lib/generated/prisma/client';
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
  const tracks = await prisma.track.findMany({
    skip: start,
    take: MAX_SITEMAP_SIZE,
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    where: { status: 'COMPLETED' },
    include: { thumbnails: true },
  });

  const appUrl = getAppUrl();
  const mappedTracks = (
    tracks as unknown as (Track & { thumbnails: Thumbnail[] })[]
  ).map((track) => {
    const biggestThumbnail = getBiggestOne(track.thumbnails, 'width');

    return {
      url: `${appUrl}/tracks/${track.id}`,
      lastModified: track.updatedAt,
      changeFrequency: 'daily',
      priority: 1,
      images: biggestThumbnail ? [biggestThumbnail.url] : undefined,
    };
  });

  return sitemapResponse(mappedTracks);
}
