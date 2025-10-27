import 'server-only';
import { config, getFeatureFlags } from './config';

// Enhanced health check with detailed diagnostics
export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: boolean;
    latency?: number;
    error?: string;
    details?: any;
  }>;
  timestamp: string;
  uptime: number;
  version: string;
}> {
  const checks: Record<string, any> = {};
  const startTime = Date.now();
  
  // Database health check
  try {
    const dbStart = Date.now();
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Test table access
    const sessionCount = await prisma.auditSession.count();
    
    checks.database = {
      status: true,
      latency: Date.now() - dbStart,
      details: {
        connection: 'ok',
        sessions: sessionCount
      }
    };
    await prisma.$disconnect();
  } catch (error) {
    checks.database = {
      status: false,
      error: (error as Error).message,
      details: {
        connection: 'failed'
      }
    };
  }
  
  // Redis health check
  try {
    const redisStart = Date.now();
    const { redis } = await import('./redis');
    
    // Test read/write (basic connectivity test)
    const testKey = `health_check_${Date.now()}`;
    await redis.set(testKey, 'test', { ex: 10 });
    const testValue = await redis.get(testKey);
    
    // Simple delete test
    try {
      await (redis as any).del?.(testKey);
    } catch {
      // del method might not be available, that's ok for health check
    }
    
    checks.redis = {
      status: testValue === 'test',
      latency: Date.now() - redisStart,
      details: {
        read_write: testValue === 'test' ? 'ok' : 'failed'
      }
    };
  } catch (error) {
    checks.redis = {
      status: false,
      error: (error as Error).message,
      details: {
        read_write: 'failed'
      }
    };
  }

  // External API health checks
  if (getFeatureFlags().discordBot) {
    try {
      const discordStart = Date.now();
      const response = await fetch('https://discord.com/api/v10/gateway', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      checks.discord_api = {
        status: response.ok,
        latency: Date.now() - discordStart,
        details: {
          status_code: response.status,
          gateway: response.ok ? 'available' : 'unavailable'
        }
      };
    } catch (error) {
      checks.discord_api = {
        status: false,
        error: (error as Error).message,
        details: {
          gateway: 'unreachable'
        }
      };
    }
  }

  // AI Service health check
  try {
    const aiStart = Date.now();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.GOOGLE_API_KEY}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    checks.ai_service = {
      status: response.ok,
      latency: Date.now() - aiStart,
      details: {
        status_code: response.status,
        service: response.ok ? 'available' : 'unavailable'
      }
    };
  } catch (error) {
    checks.ai_service = {
      status: false,
      error: (error as Error).message,
      details: {
        service: 'unreachable'
      }
    };
  }

  // Memory and system health
  const memUsage = process.memoryUsage();
  checks.memory = {
    status: true,
    details: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
      heap_used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heap_total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
    }
  };

  // Determine overall status
  const checkResults = Object.values(checks);
  const healthyCount = checkResults.filter(check => check.status).length;
  const totalCount = checkResults.length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyCount === totalCount) {
    status = 'healthy';
  } else if (healthyCount >= totalCount * 0.7) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    version: process.env.npm_package_version || '1.0.0'
  };
}
