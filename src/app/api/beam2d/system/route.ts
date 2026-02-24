import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiBaseUrl = process.env.ESTRUTURA_API_URL ?? 'http://localhost:3001';
  const apiPath = process.env.ESTRUTURA_API_PATH ?? '/beam2d/system';

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
    const message = error instanceof Error ? error.message : 'Erro ao conectar com API de estrutura.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
