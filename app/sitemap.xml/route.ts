import prisma from '@/lib/prisma';
import { MAX_SITEMAP_SIZE } from '@/lib/constants';
import { getAppUrl, sitemapIndexResponse } from '@/lib/sitemap-xml';
import { connection } from 'next/server';

const getPartIds = (total: number) =>
  Array.from({ length: Math.ceil(total / MAX_SITEMAP_SIZE) }, (_, id) => id);

export async function GET() {
  await connection();

  const appUrl = getAppUrl();
  const trackTotal = await prisma.track.count({
    where: { status: 'COMPLETED' },
  });
  const artistTotal = await prisma.artist.count({
    where: {
      trackArtists: { some: { track: { status: 'COMPLETED' } } },
    },
  });
  const albumTotal = await prisma.album.count({
    where: {
      tracks: { some: { status: 'COMPLETED' } },
    },
  });

  const allParts = [
    ...getPartIds(trackTotal).map((id) => `${appUrl}/tracks/sitemap/${id}.xml`),
    ...getPartIds(artistTotal).map(
      (id) => `${appUrl}/artists/sitemap/${id}.xml`,
    ),
    ...getPartIds(albumTotal).map((id) => `${appUrl}/albums/sitemap/${id}.xml`),
  ];

  return sitemapIndexResponse(allParts);
}
