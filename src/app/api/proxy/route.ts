import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const ping = req.nextUrl.searchParams.get('ping');

  if (ping) return new NextResponse("PONG", { status: 200 });
  if (!url) return new NextResponse("Missing URL parameter", { status: 400 });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 Seconds Timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
        'Accept': '*/*',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout if successful

    if (!response.ok) {
      return new NextResponse(`Upstream Error: ${response.status}`, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    
    let contentType = response.headers.get('content-type') || 'application/octet-stream';
    if (url.includes('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
    else if (url.includes('.ts')) contentType = 'video/mp2t';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Proxy Error:", error.name, error.message);
    
    if (error.name === 'AbortError') {
      return new NextResponse("Gateway Timeout: Upstream server is dead.", { status: 504 });
    }
    
    return new NextResponse(`Proxy Failed: ${error.message}`, { status: 500 });
  }
}
