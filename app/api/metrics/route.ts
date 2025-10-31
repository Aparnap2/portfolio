import { NextResponse } from 'next/server';
import { MetricsCollector } from '@/lib/metrics';
import { withTiming } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

// Metrics endpoint exposing JSON data for Sentry-based monitoring
const handler = withTiming(async (req: Request) => {
  const metrics = MetricsCollector.getInstance();

  try {
    const detailedMetrics = metrics.getMetrics();

    return NextResponse.json({
      metrics: detailedMetrics,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to collect metrics',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}, 'metrics_endpoint');

export async function GET(req: Request) {
  return handler(req);
}