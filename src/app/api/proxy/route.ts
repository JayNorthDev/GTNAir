import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse("The proxy mechanism has been removed. Use direct stream URLs.", { status: 410 });
}