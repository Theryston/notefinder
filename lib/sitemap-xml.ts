type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: string;
  priority?: number;
  images?: string[];
};

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const formatLastModified = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : value;

const xmlHeaders = {
  'Cache-Control':
    'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
  'Content-Type': 'application/xml; charset=utf-8',
};

export function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is required to generate sitemaps');
  }

  return appUrl;
}

export function parseSitemapPartId(value: string) {
  const match = /^(\d+)\.xml$/.exec(value);
  if (!match) return null;

  const id = Number(match[1]);
  return Number.isSafeInteger(id) ? id : null;
}

export function sitemapIndexResponse(urls: string[]) {
  const body = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((url) => `<sitemap><loc>${escapeXml(url)}</loc></sitemap>`)
    .join('')}</sitemapindex>`;

  return new Response(body, { headers: xmlHeaders });
}

export function sitemapResponse(entries: SitemapEntry[]) {
  const hasImages = entries.some((entry) => entry.images?.length);
  const imageNamespace = hasImages
    ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
    : '';

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageNamespace}>${entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `<lastmod>${escapeXml(formatLastModified(entry.lastModified))}</lastmod>`
        : '';
      const changeFrequency = entry.changeFrequency
        ? `<changefreq>${escapeXml(entry.changeFrequency)}</changefreq>`
        : '';
      const priority =
        entry.priority === undefined
          ? ''
          : `<priority>${entry.priority}</priority>`;
      const images = (entry.images ?? [])
        .map(
          (image) =>
            `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`,
        )
        .join('');

      return `<url><loc>${escapeXml(entry.url)}</loc>${lastModified}${changeFrequency}${priority}${images}</url>`;
    })
    .join('')}</urlset>`;

  return new Response(body, { headers: xmlHeaders });
}
