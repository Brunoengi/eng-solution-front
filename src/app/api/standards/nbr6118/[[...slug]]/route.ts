import { NextResponse } from 'next/server';

const buildApiPath = (slug: string[] | undefined): string => {
  if (!slug || slug.length === 0) {
    return '/standards/nbr6118';
  }

  return `/standards/nbr6118/${slug.join('/')}`;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const apiBaseUrl = process.env.ESTRUTURA_API_URL ?? 'http://localhost:3001';
  const { slug } = await context.params;
  const apiPath = buildApiPath(slug);
  const queryString = new URL(request.url).search;
  const endpoint = `${apiBaseUrl}${apiPath}${queryString}`;

  try {
    const upstreamResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const rawResponse = await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      let upstreamBody: unknown = rawResponse;

      try {
        upstreamBody = rawResponse ? JSON.parse(rawResponse) : null;
      } catch {
        upstreamBody = rawResponse;
      }

      return NextResponse.json(
        {
          statusCode: upstreamResponse.status,
          endpoint,
          upstreamBody,
        },
        { status: upstreamResponse.status },
      );
    }

    return new Response(rawResponse, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type':
          upstreamResponse.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Erro ao conectar com API de normas.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
