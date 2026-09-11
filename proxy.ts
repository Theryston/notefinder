import { auth } from './auth';

export const proxy = auth((request) => {
  console.log(
    JSON.stringify({
      type: 'incoming-request',
      method: request.method,
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      ip:
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('fly-client-ip') ??
        request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      acceptLanguage: request.headers.get('accept-language'),
      cfCountry: request.headers.get('cf-ipcountry'),
      cfRay: request.headers.get('cf-ray'),
      secFetchSite: request.headers.get('sec-fetch-site'),
      secFetchMode: request.headers.get('sec-fetch-mode'),
      hasCookie: Boolean(request.headers.get('cookie')),
      timestamp: new Date().toISOString(),
    }),
  );
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
