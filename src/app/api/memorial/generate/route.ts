import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiBaseUrl = process.env.ESTRUTURA_API_URL ?? 'http://localhost:3001';
  const apiPath = '/memorial/generate';

  try {
    const payload = await request.json();

    const upstreamResponse = await fetch(`${apiBaseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: request.headers.get('accept') ?? 'application/pdf',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!upstreamResponse.ok) {
      const rawError = await upstreamResponse.text();
      let upstreamBody: unknown = rawError;

      try {
        upstreamBody = rawError ? JSON.parse(rawError) : null;
      } catch {
        upstreamBody = rawError;
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

    const contentType = upstreamResponse.headers.get('content-type') ?? 'application/pdf';

    // Preserve binary payloads such as PDFs.
    const buffer = await upstreamResponse.arrayBuffer();

    return new Response(buffer, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao conectar com API de memorial.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
