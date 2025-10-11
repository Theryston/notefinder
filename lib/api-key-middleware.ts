import { NextResponse } from 'next/server';

export async function apiKeyMiddleware(request: Request) {
  const apiKey = request.headers.get('x-api-key');

  if (apiKey !== process.env.PRIVATE_ROUTES_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}
