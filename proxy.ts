import { auth } from './auth';

export const proxy = auth((request) => {
  console.log(
    JSON.stringify({
      type: 'incoming-request',
      method: request.method,
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      ip:
        request.headers.get('fly-client-ip') ??
        request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    }),
  );
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
