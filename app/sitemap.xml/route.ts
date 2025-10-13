import { generateSitemaps as generateSitemapsAlbums } from '../albums/sitemap';
import { generateSitemaps as generateSitemapsArtists } from '../artists/sitemap';
import { generateSitemaps as generateSitemapsTracks } from '../tracks/sitemap';

const generateSitemapLink = (url: string) =>
  `<sitemap><loc>${url}</loc></sitemap>`;

export async function GET() {
  const allAlbumsParts = await generateSitemapsAlbums();
  const allArtistsParts = await generateSitemapsArtists();
  const allTracksParts = await generateSitemapsTracks();

  const allParts = [
    ...allTracksParts.map(
      ({ id }) => `${process.env.NEXT_PUBLIC_APP_URL}/tracks/sitemap/${id}.xml`,
    ),
    ...allArtistsParts.map(
      ({ id }) =>
        `${process.env.NEXT_PUBLIC_APP_URL}/artists/sitemap/${id}.xml`,
    ),
    ...allAlbumsParts.map(
      ({ id }) => `${process.env.NEXT_PUBLIC_APP_URL}/albums/sitemap/${id}.xml`,
    ),
  ];

  const sitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allParts
    .map(generateSitemapLink)
    .join('')}</sitemapindex>`;

  return new Response(sitemapIndexXML, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
