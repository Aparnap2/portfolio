import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/health';
import { MetricsCollector } from '@/lib/metrics';
import { withTiming } from '@/lib/metrics';
import { config } from '@/lib/config';

// Enhanced health endpoint with detailed diagnostics
const handler = withTiming(async () => {
  const metrics = MetricsCollector.getInstance();
  
  try {
    // Track health check requests
    metrics.increment('health_check_requests', 1, {
      endpoint: '/api/health'
    });

    const health = await healthCheck();
    
    // Track health status
    metrics.increment('health_check_status', 1, {
      status: health.status
    });

    // Return appropriate response based on health status
    const statusCode = health.status === 'healthy' ? 200 :
                     health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    // Track health check failures
    metrics.increment('health_check_errors', 1, {
      error_type: (error as Error).constructor.name
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}, 'health_check');

export async function GET() {
  return handler();
}

// Add OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Add detailed metrics endpoint
export async function POST() {
  try {
    const metrics = MetricsCollector.getInstance();
    const detailedMetrics = metrics.getMetrics();
    
    return NextResponse.json({
      metrics: detailedMetrics,
      config: {
        environment: config.NODE_ENV,
        features: {
          discordBot: config.ENABLE_DISCORD_BOT,
          emailNotifications: config.ENABLE_EMAIL_NOTIFICATIONS,
          analytics: config.ENABLE_ANALYTICS,
          metrics: config.ENABLE_METRICS,
          errorReporting: config.ENABLE_ERROR_REPORTING
        }
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to retrieve metrics',
        message: (error as Error).message
      },
      { status: 500 }
    );
  }
}