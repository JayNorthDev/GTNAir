
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const isPing = searchParams.get('ping');

  if (isPing === 'true') {
    return new NextResponse('PONG', { status: 200 });
  }

  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Proxy Error:', error);
    return new NextResponse('Proxy error', { status: 500 });
  }
}
