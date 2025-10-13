import { generateSitemaps } from '../albums/sitemap';

const generateSitemapLink = (url: string) =>
  `<sitemap><loc>${url}</loc></sitemap>`;

export async function GET() {
  const allAlbumsParts = await generateSitemaps();

  const allParts = [
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
