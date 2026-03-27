import { NextResponse } from 'next/server';

const buildApiPath = (slug: string[] | undefined): string => {
  if (!slug || slug.length === 0) {
    return '/geometry';
  }

  return `/geometry/${slug.join('/')}`;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const apiBaseUrl = process.env.ESTRUTURA_API_URL ?? 'http://localhost:3001';
  const { slug } = await context.params;
  const apiPath = buildApiPath(slug);

  try {
    const payload = await request.json();

    const upstreamResponse = await fetch(`${apiBaseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
          endpoint: `${apiBaseUrl}${apiPath}`,
          upstreamBody,
        },
        { status: upstreamResponse.status },
      );
    }

    return new Response(rawResponse, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao conectar com API de geometria.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
