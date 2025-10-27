import * as Sentry from "@sentry/nextjs";

// Enhanced Circuit Breaker with monitoring and configurable options
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private successCount = 0;
  private requestCount = 0;

  constructor(
    private options: {
      threshold?: number;
      timeout?: number;
      halfOpenMaxCalls?: number;
      monitoringThreshold?: number;
      name?: string;
    } = {}
  ) {
    const {
      threshold = 5,
      timeout = 60000,
      halfOpenMaxCalls = 3,
      monitoringThreshold = 10,
      name = 'default'
    } = options;
    
    this.threshold = threshold;
    this.timeout = timeout;
    this.halfOpenMaxCalls = halfOpenMaxCalls;
    this.monitoringThreshold = monitoringThreshold;
    this.name = name;
  }

  private threshold: number;
  private timeout: number;
  private halfOpenMaxCalls: number;
  private monitoringThreshold: number;
  private name: string;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.requestCount++;
    
    // Log monitoring data periodically
    if (this.requestCount % this.monitoringThreshold === 0) {
      console.log(`[CircuitBreaker:${this.name}] Stats:`, {
        state: this.state,
        failures: this.failures,
        successCount: this.successCount,
        requestCount: this.requestCount,
        successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(2) + '%' : '0%'
      });
    }

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN`);
      } else {
        const error = new Error(`Circuit breaker ${this.name} is OPEN`);
        Sentry.captureException(error, {
          tags: { circuitBreaker: this.name, state: 'OPEN' },
          extra: { failures: this.failures, timeUntilReset: this.timeout - (Date.now() - this.lastFailTime) }
        });
        throw error;
      }
    }

    if (this.state === 'HALF_OPEN' && this.successCount >= this.halfOpenMaxCalls) {
      this.state = 'CLOSED';
      this.failures = 0;
      console.log(`[CircuitBreaker:${this.name}] Transitioning to CLOSED`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker:${this.name}] HALF_OPEN success: ${this.successCount}/${this.halfOpenMaxCalls}`);
    } else {
      this.failures = 0;
      this.state = 'CLOSED';
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.state === 'HALF_OPEN' || this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.error(`[CircuitBreaker:${this.name}] Transitioning to OPEN. Failures: ${this.failures}`);
      
      Sentry.captureException(new Error(`Circuit breaker ${this.name} opened`), {
        tags: { circuitBreaker: this.name, state: 'OPEN' },
        extra: { failures: this.failures, threshold: this.threshold }
      });
    }
  }

  // Get current state for monitoring
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailTime: this.lastFailTime,
      successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Manual reset for testing/maintenance
  reset() {
    this.failures = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.lastFailTime = 0;
    this.state = 'CLOSED';
    console.log(`[CircuitBreaker:${this.name}] Manually reset`);
  }
}

// Enhanced retry with exponential backoff, jitter, and error classification
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    jitter?: boolean;
    retryCondition?: (error: Error) => boolean;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryCondition = (error: Error) => {
      // Retry on network errors and 5xx server errors
      return error.message.includes('fetch') ||
             error.message.includes('timeout') ||
             (error.message.includes('status') && parseInt(error.message.match(/\d+/)?.[0] || '0') >= 500);
    },
    onRetry
  } = options;

  let lastError: Error | undefined;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (i === maxRetries || !retryCondition(lastError)) {
        break;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(baseDelay * Math.pow(backoffMultiplier, i), maxDelay);
      
      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      console.warn(`[Retry] Attempt ${i + 1} failed, retrying in ${Math.round(delay)}ms:`, lastError.message);
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(lastError, i + 1);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // Log final failure with context
  if (lastError) {
    console.error(`[Retry] All ${maxRetries + 1} attempts failed:`, lastError);
    Sentry.captureException(lastError, {
      tags: { retryFailed: 'true', attempts: maxRetries + 1 },
      extra: { finalError: lastError.message }
    });
    
    throw lastError;
  }
  
  throw new Error('Unknown error occurred during retry');
}

// Enhanced error boundary with fallback strategies and error classification
export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    fallback?: (...args: Parameters<T>) => ReturnType<T>;
    errorClassifier?: (error: Error) => 'transient' | 'permanent' | 'critical';
    onError?: (error: Error, context: { args: Parameters<T> }) => void;
    name?: string;
  } = {}
): T {
  const {
    fallback,
    errorClassifier = (error: Error) => {
      // Classify errors for appropriate handling
      if (error.message.includes('Circuit breaker is OPEN')) return 'transient';
      if (error.message.includes('timeout')) return 'transient';
      if (error.message.includes('validation')) return 'permanent';
      return 'critical';
    },
    onError,
    name = 'unnamed'
  } = options;

  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          const errorType = errorClassifier(error);
          
          // Log error with context
          console.error(`[ErrorBoundary:${name}] ${errorType} error:`, error);
          
          // Send to Sentry with additional context
          Sentry.captureException(error, {
            tags: { errorBoundary: name, errorType },
            extra: { args: args.length > 0 ? JSON.stringify(args).substring(0, 500) : 'none' }
          });

          // Call error callback if provided
          if (onError) {
            onError(error, { args });
          }

          // Return fallback for transient/permanent errors, re-throw critical
          if (fallback && (errorType === 'transient' || errorType === 'permanent')) {
            return fallback(...args);
          }
          
          throw error;
        });
      }
      return result;
    } catch (error) {
      const errorType = errorClassifier(error as Error);
      
      console.error(`[ErrorBoundary:${name}] ${errorType} error:`, error);
      
      Sentry.captureException(error, {
        tags: { errorBoundary: name, errorType },
        extra: { args: args.length > 0 ? JSON.stringify(args).substring(0, 500) : 'none' }
      });

      if (onError) {
        onError(error as Error, { args });
      }

      if (fallback && (errorType === 'transient' || errorType === 'permanent')) {
        return fallback(...args);
      }
      
      throw error;
    }
  }) as T;
}

// Graceful degradation utility
export function withGracefulDegradation<T>(
  primaryFn: () => Promise<T>,
  fallbackFns: Array<() => Promise<T>>,
  options: {
    name?: string;
    timeout?: number;
  } = {}
): Promise<T> {
  const { name = 'unnamed', timeout = 5000 } = options;
  
  async function executeWithTimeout(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  return executeWithTimeout(primaryFn, timeout)
    .catch(async (primaryError) => {
      console.warn(`[GracefulDegradation:${name}] Primary failed:`, primaryError.message);
      
      for (let i = 0; i < fallbackFns.length; i++) {
        try {
          console.log(`[GracefulDegradation:${name}] Trying fallback ${i + 1}`);
          return await executeWithTimeout(fallbackFns[i], timeout);
        } catch (fallbackError) {
          console.warn(`[GracefulDegradation:${name}] Fallback ${i + 1} failed:`, (fallbackError as Error).message);
        }
      }
      
      // All options failed
      throw new Error(`All options failed for ${name}. Primary: ${primaryError.message}`);
    });
}

// Error recovery utilities
export const ErrorRecovery = {
  // Check if error is recoverable
  isRecoverable: (error: Error): boolean => {
    const recoverablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /circuit breaker.*open/i,
      /rate limit/i,
      /502/i,
      /503/i,
      /504/i
    ];
    
    return recoverablePatterns.some(pattern => pattern.test(error.message));
  },

  // Get suggested retry delay based on error type
  getRetryDelay: (error: Error, baseDelay = 1000): number => {
    if (error.message.includes('rate limit')) return baseDelay * 10;
    if (error.message.includes('timeout')) return baseDelay * 5;
    if (error.message.includes('circuit breaker')) return baseDelay * 20;
    return baseDelay;
  },

  // Create user-friendly error message
  getUserMessage: (error: Error): string => {
    if (error.message.includes('validation')) return 'Please check your input and try again.';
    if (error.message.includes('timeout')) return 'Request timed out. Please try again.';
    if (error.message.includes('network')) return 'Network error. Please check your connection.';
    if (error.message.includes('rate limit')) return 'Too many requests. Please wait and try again.';
    return 'Something went wrong. Please try again.';
  }
};