export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { readDomainRegistry } from '@/app/lib/domain-registry';

function ageInDays(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export async function GET() {
  const domains = await readDomainRegistry();

  return NextResponse.json({
    status: 'ok',
    count: domains.length,
    domains: domains.map((item) => ({
      ...item,
      certAgeDays: item.certIssuedAt ? ageInDays(item.certIssuedAt) : null,
      certDaysRemaining: item.certExpiresAt
        ? Math.floor((new Date(item.certExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null
    }))
  });
}
