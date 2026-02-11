import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'breachrabbit-web-panel',
    timestamp: new Date().toISOString()
  });
}
