import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsData, AnalyticsData } from '@/lib/analytics/ga-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_MAX_AGE_MS = 60 * 60 * 24 * 1000;

function hasValidAdminSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value || !process.env.ADMIN_ID) {
    return false;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString(),
    ) as { adminId?: string; timestamp?: number };

    if (decoded.adminId !== process.env.ADMIN_ID || !decoded.timestamp) {
      return false;
    }

    return Date.now() - decoded.timestamp <= SESSION_MAX_AGE_MS;
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<AnalyticsData | { error: string }>> {
  if (!hasValidAdminSession(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    const data = await getAnalyticsData({ forceRefresh });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
