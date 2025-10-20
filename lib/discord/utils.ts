import * as Sentry from '@sentry/nextjs';
import { redis } from '../redis';
import { BotStats, AuditMetrics, BotHealthCheck, DiscordConfig } from './types';

export class DiscordLogger {
  private static instance: DiscordLogger;
  private logLevel: DiscordConfig['logLevel'];

  constructor(logLevel: DiscordConfig['logLevel'] = 'info') {
    this.logLevel = logLevel;
  }

  static getInstance(logLevel?: DiscordConfig['logLevel']): DiscordLogger {
    if (!DiscordLogger.instance) {
      DiscordLogger.instance = new DiscordLogger(logLevel);
    }
    return DiscordLogger.instance;
  }

  private shouldLog(level: DiscordConfig['logLevel']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[Discord][Debug] ${message}`, meta);
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[Discord][Info] ${message}`, meta);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[Discord][Warn] ${message}`, meta);
      Sentry.captureMessage(message, 'warning', { extra: meta });
    }
  }

  error(message: string, error?: Error, meta?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[Discord][Error] ${message}`, error, meta);
      
      if (error) {
        Sentry.captureException(error, {
          tags: { component: 'discord' },
          extra: meta,
        });
      } else {
        Sentry.captureMessage(message, 'error', { extra: meta });
      }
    }
  }
}

export class DiscordMetrics {
  private static instance: DiscordMetrics;
  private metrics: Map<string, number> = new Map();

  static getInstance(): DiscordMetrics {
    if (!DiscordMetrics.instance) {
      DiscordMetrics.instance = new DiscordMetrics();
    }
    return DiscordMetrics.instance;
  }

  incrementCounter(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  getCounter(name: string): number {
    return this.metrics.get(name) || 0;
  }

  async recordCommandExecution(metrics: AuditMetrics): Promise<void> {
    try {
      // Store in Redis for analytics
      await redis.zadd(
        'discord:commands:recent',
        Date.now(),
        JSON.stringify(metrics)
      );

      // Keep only last 1000 command executions
      await redis.zremrangebyrank('discord:commands:recent', 0, -1001);

      // Update counters
      this.incrementCounter(`command:${metrics.commandName}:total`);
      this.incrementCounter('commands:total');
      
      if (!metrics.success) {
        this.incrementCounter('commands:failed');
      }

      // Log to Sentry for monitoring
      Sentry.addBreadcrumb({
        message: `Discord command executed: ${metrics.commandName}`,
        level: metrics.success ? 'info' : 'error',
        data: {
          commandName: metrics.commandName,
          userId: metrics.userId,
          guildId: metrics.guildId,
          executionTime: metrics.executionTime,
          success: metrics.success,
        }
      });

    } catch (error) {
      console.error('[Discord] Failed to record command metrics:', error);
    }
  }

  async getCommandStats(hours: number = 24): Promise<Record<string, any>> {
    try {
      const cutoff = Date.now() - (hours * 60 * 60 * 1000);
      const recentCommands = await redis.zrangebyscore(
        'discord:commands:recent',
        cutoff,
        Date.now()
      );

      const stats = {
        totalCommands: recentCommands.length,
        successfulCommands: 0,
        failedCommands: 0,
        averageExecutionTime: 0,
        topCommands: {} as Record<string, number>,
        errors: [] as string[],
      };

      let totalExecutionTime = 0;
      const commandCounts: Record<string, number> = {};

      for (const commandStr of recentCommands) {
        const command: AuditMetrics = JSON.parse(commandStr);
        
        if (command.success) {
          stats.successfulCommands++;
        } else {
          stats.failedCommands++;
          if (command.error) {
            stats.errors.push(command.error);
          }
        }

        totalExecutionTime += command.executionTime;
        commandCounts[command.commandName] = (commandCounts[command.commandName] || 0) + 1;
      }

      stats.averageExecutionTime = stats.totalCommands > 0 ? totalExecutionTime / stats.totalCommands : 0;
      stats.topCommands = Object.entries(commandCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((acc, [name, count]) => ({ ...acc, [name]: count }), {});

      return stats;
    } catch (error) {
      console.error('[Discord] Failed to get command stats:', error);
      return {};
    }
  }

  getLocalStats(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  reset(): void {
    this.metrics.clear();
  }
}

export class BotMaintenance {
  private static instance: BotMaintenance;
  private logger = DiscordLogger.getInstance();

  static getInstance(): BotMaintenance {
    if (!BotMaintenance.instance) {
      BotMaintenance.instance = new BotMaintenance();
    }
    return BotMaintenance.instance;
  }

  async performHealthCheck(): Promise<BotHealthCheck> {
    const startTime = Date.now();
    let latency = 0;
    let errorsInLastHour = 0;
    
    try {
      // Test Redis connection
      const redisStart = Date.now();
      await redis.ping();
      latency = Date.now() - redisStart;

      // Count recent errors from metrics
      const errorStats = await DiscordMetrics.getInstance().getCommandStats(1);
      errorsInLastHour = errorStats.failedCommands || 0;

    } catch (error) {
      this.logger.error('Health check failed', error as Error);
    }

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Determine status
    let status: BotHealthCheck['status'] = 'healthy';
    if (errorsInLastHour > 10) status = 'degraded';
    if (latency > 5000 || memoryUsage.heapUsed > 500 * 1024 * 1024) status = 'unhealthy';

    return {
      status,
      timestamp: new Date(),
      uptime,
      latency,
      memoryUsage,
      guilds: this.getLocalCounter('guilds'),
      commandsExecuted: this.getLocalCounter('commands:total'),
      errorsInLastHour,
    };
  }

  async cleanupOldMetrics(): Promise<void> {
    try {
      // Remove command metrics older than 7 days
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      await redis.zremrangebyscore('discord:commands:recent', 0, weekAgo);
      
      this.logger.info('Cleaned up old metrics');
    } catch (error) {
      this.logger.error('Failed to cleanup old metrics', error as Error);
    }
  }

  private getLocalCounter(name: string): number {
    return DiscordMetrics.getInstance().getCounter(name);
  }

  async getBotStats(): Promise<BotStats> {
    try {
      const metrics = DiscordMetrics.getInstance();
      const memoryUsage = process.memoryUsage();

      return {
        guildCount: metrics.getCounter('guilds'),
        userCount: metrics.getCounter('users'),
        commandCount: metrics.getCounter('commands:total'),
        uptime: process.uptime(),
        memoryUsage,
      };
    } catch (error) {
      this.logger.error('Failed to get bot stats', error as Error);
      return {
        guildCount: 0,
        userCount: 0,
        commandCount: 0,
        uptime: 0,
        memoryUsage: process.memoryUsage(),
      };
    }
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  
  return input
    .replace(/[^a-zA-Z0-9\s\-_.@]/g, '')
    .substring(0, maxLength)
    .trim();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function getUserPermissionLevel(member: any): 'admin' | 'moderator' | 'user' {
  if (!member) return 'user';
  
  if (member.permissions.has('Administrator')) return 'admin';
  if (member.permissions.has('ManageGuild')) return 'moderator';
  
  return 'user';
}

export async function rateLimitCheck(
  userId: string, 
  windowMs: number = 60000, 
  maxRequests: number = 10
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `discord:ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);

    // Check current count
    const count = await redis.zcard(key);

    if (count >= maxRequests) {
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest.length > 1 ? parseInt(oldestRequest[1]) + windowMs : now + windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    // Add current request
    await redis.zadd(key, now, now.toString());
    await redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: maxRequests - count - 1,
      resetTime: now + windowMs,
    };

  } catch (error) {
    console.error('[Discord] Rate limit check failed:', error);
    // Allow request if Redis fails
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }
}
