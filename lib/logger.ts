import * as Sentry from "@sentry/nextjs";
import { MetricsCollector } from "./metrics";

// Enhanced structured logging with multiple levels and context
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  operation?: string;
  duration?: number;
  status?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private metrics = MetricsCollector.getInstance();

  static getInstance() {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${levelName}: ${message}${contextStr}`;
  }

  private logToMetrics(level: LogLevel, message: string, context?: LogContext) {
    const tags = {
      level: LogLevel[level].toLowerCase(),
      component: context?.component || 'unknown',
      operation: context?.operation || 'unknown',
      ...context?.tags
    };

    this.metrics.increment('log_entries', 1, tags);

    if (level >= LogLevel.ERROR) {
      this.metrics.increment('error_logs', 1, tags);
    }

    if (context?.duration) {
      this.metrics.timing('operation_duration', context.duration, tags);
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    this.logToMetrics(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog(LogLevel.INFO)) return;

    console.info(this.formatMessage(LogLevel.INFO, message, context));
    this.logToMetrics(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog(LogLevel.WARN)) return;

    console.warn(this.formatMessage(LogLevel.WARN, message, context));
    this.logToMetrics(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    console.error(this.formatMessage(LogLevel.ERROR, message, context), error);

    // Send to Sentry for ERROR and above
    Sentry.captureException(error || new Error(message), {
      level: 'error',
      tags: {
        logger: 'true',
        component: context?.component,
        operation: context?.operation,
        ...context?.tags
      },
      extra: {
        message,
        context,
        ...context?.metadata
      }
    });

    this.logToMetrics(LogLevel.ERROR, message, context);
  }

  fatal(message: string, error?: Error, context?: LogContext) {
    if (!this.shouldLog(LogLevel.FATAL)) return;

    console.error(this.formatMessage(LogLevel.FATAL, message, context), error);

    // Send to Sentry as fatal
    Sentry.captureException(error || new Error(message), {
      level: 'fatal',
      tags: {
        logger: 'true',
        fatal: 'true',
        component: context?.component,
        operation: context?.operation,
        ...context?.tags
      },
      extra: {
        message,
        context,
        ...context?.metadata
      }
    });

    this.logToMetrics(LogLevel.FATAL, message, context);
  }

  // Performance logging helper
  time(label: string, context?: Omit<LogContext, 'duration'>) {
    const start = Date.now();
    return {
      end: (additionalContext?: LogContext) => {
        const duration = Date.now() - start;
        this.info(`${label} completed`, {
          ...context,
          ...additionalContext,
          duration
        });
      }
    };
  }

  // Request logging helper
  logRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext) {
    const level = statusCode >= 500 ? LogLevel.ERROR :
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;

    if (level === LogLevel.ERROR) {
      this.error(message, undefined, { ...context, duration });
    } else if (level === LogLevel.WARN) {
      this.warn(message, { ...context, duration });
    } else {
      this.info(message, { ...context, duration });
    }
  }
}

// Convenience functions
export const logger = Logger.getInstance();

export function logError(error: Error, context?: LogContext) {
  logger.error(error.message, error, context);
}

export function logPerformance(label: string, duration: number, context?: LogContext) {
  logger.info(`${label} took ${duration}ms`, { ...context, duration });
}

export function withLogging<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string,
  context?: LogContext
): T {
  return ((...args: Parameters<T>) => {
    const timer = logger.time(operationName, context);

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result
          .then(value => {
            timer.end({ status: 'success' });
            return value;
          })
          .catch(error => {
            timer.end({ status: 'error' });
            logger.error(`${operationName} failed`, error, context);
            throw error;
          });
      }

      timer.end({ status: 'success' });
      return result;
    } catch (error) {
      timer.end({ status: 'error' });
      logger.error(`${operationName} failed`, error as Error, context);
      throw error;
    }
  }) as T;
}