import * as Sentry from "@sentry/nextjs";
import { MetricsCollector } from "./metrics";

// Enhanced Circuit Breaker with advanced state management, metrics, and adaptive behavior
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private successCount = 0;
  private requestCount = 0;
  private consecutiveSuccesses = 0;
  private consecutiveFailures = 0;
  private stateChangeTime = Date.now();
  private adaptiveTimeout = false;

  constructor(
    private options: {
      threshold?: number;
      timeout?: number;
      halfOpenMaxCalls?: number;
      monitoringThreshold?: number;
      name?: string;
      adaptiveTimeout?: boolean;
      successThreshold?: number;
      failureThreshold?: number;
    } = {}
  ) {
    const {
      threshold = 5,
      timeout = 60000,
      halfOpenMaxCalls = 3,
      monitoringThreshold = 10,
      name = 'default',
      adaptiveTimeout = false,
      successThreshold = 3,
      failureThreshold = 5
    } = options;

    this.threshold = threshold;
    this.timeout = timeout;
    this.halfOpenMaxCalls = halfOpenMaxCalls;
    this.monitoringThreshold = monitoringThreshold;
    this.name = name;
    this.adaptiveTimeout = adaptiveTimeout;
    this.successThreshold = successThreshold;
    this.failureThreshold = failureThreshold;
  }

  private threshold: number;
  private timeout: number;
  private halfOpenMaxCalls: number;
  private monitoringThreshold: number;
  private name: string;
  private successThreshold: number;
  private failureThreshold: number;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.requestCount++;

    // Enhanced monitoring with metrics
    if (this.requestCount % this.monitoringThreshold === 0) {
      console.log(`[CircuitBreaker:${this.name}] Stats:`, {
        state: this.state,
        failures: this.failures,
        successCount: this.successCount,
        requestCount: this.requestCount,
        successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
        consecutiveSuccesses: this.consecutiveSuccesses,
        consecutiveFailures: this.consecutiveFailures,
        timeInState: Date.now() - this.stateChangeTime
      });
    }

    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailTime;
      const currentTimeout = this.adaptiveTimeout ?
        Math.min(this.timeout * Math.pow(1.5, Math.floor(this.failures / this.failureThreshold)), this.timeout * 10) :
        this.timeout;

      if (timeSinceFailure > currentTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        this.consecutiveSuccesses = 0;
        this.stateChangeTime = Date.now();
        console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN (timeout: ${currentTimeout}ms)`);

        Sentry.captureMessage(`Circuit breaker ${this.name} entering HALF_OPEN`, {
          level: 'info',
          tags: { circuitBreaker: this.name, stateChange: 'OPEN_TO_HALF_OPEN' },
          extra: { timeSinceFailure, adaptiveTimeout: currentTimeout }
        });
      } else {
        const error = new Error(`Circuit breaker ${this.name} is OPEN`);
        Sentry.captureException(error, {
          tags: { circuitBreaker: this.name, state: 'OPEN' },
          extra: {
            failures: this.failures,
            timeUntilReset: currentTimeout - timeSinceFailure,
            consecutiveFailures: this.consecutiveFailures
          }
        });
        throw error;
      }
    }

    if (this.state === 'HALF_OPEN' && this.consecutiveSuccesses >= this.successThreshold) {
      this.state = 'CLOSED';
      this.failures = 0;
      this.consecutiveFailures = 0;
      this.stateChangeTime = Date.now();
      console.log(`[CircuitBreaker:${this.name}] Transitioning to CLOSED after ${this.consecutiveSuccesses} successes`);

      Sentry.captureMessage(`Circuit breaker ${this.name} recovered to CLOSED`, {
        level: 'info',
        tags: { circuitBreaker: this.name, stateChange: 'HALF_OPEN_TO_CLOSED' },
        extra: { consecutiveSuccesses: this.consecutiveSuccesses }
      });
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
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    if (this.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker:${this.name}] HALF_OPEN success: ${this.consecutiveSuccesses}/${this.successThreshold}`);
    } else {
      this.failures = Math.max(0, this.failures - 1); // Gradually reduce failure count
      if (this.state !== 'CLOSED') {
        this.state = 'CLOSED';
        this.stateChangeTime = Date.now();
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.consecutiveFailures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.stateChangeTime = Date.now();
      console.error(`[CircuitBreaker:${this.name}] Transitioning to OPEN. Consecutive failures: ${this.consecutiveFailures}`);

      Sentry.captureException(new Error(`Circuit breaker ${this.name} opened`), {
        tags: {
          circuitBreaker: this.name,
          state: 'OPEN',
          stateChange: 'OPEN',
          previousState: this.state
        },
        extra: {
          failures: this.failures,
          consecutiveFailures: this.consecutiveFailures,
          threshold: this.failureThreshold,
          timeInPreviousState: Date.now() - this.stateChangeTime
        }
      });
    }
  }

  // Get current state for monitoring
  getState() {
    const timeInState = Date.now() - this.stateChangeTime;
    const successRate = this.requestCount > 0 ? (this.successCount / this.requestCount * 100) : 0;

    return {
      state: this.state,
      failures: this.failures,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailTime: this.lastFailTime,
      successRate: successRate.toFixed(2) + '%',
      consecutiveSuccesses: this.consecutiveSuccesses,
      consecutiveFailures: this.consecutiveFailures,
      timeInState,
      stateChangeTime: this.stateChangeTime,
      adaptiveTimeout: this.adaptiveTimeout,
      nextTimeoutCheck: this.state === 'OPEN' ?
        this.lastFailTime + (this.adaptiveTimeout ?
          Math.min(this.timeout * Math.pow(1.5, Math.floor(this.failures / this.failureThreshold)), this.timeout * 10) :
          this.timeout) : null
    };
  }

  // Manual reset for testing/maintenance
  reset() {
    this.failures = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.lastFailTime = 0;
    this.state = 'CLOSED';
    this.consecutiveSuccesses = 0;
    this.consecutiveFailures = 0;
    this.stateChangeTime = Date.now();
    console.log(`[CircuitBreaker:${this.name}] Manually reset`);

    // Check if Sentry has captureMessage method
    if (Sentry.captureMessage) {
      Sentry.captureMessage(`Circuit breaker ${this.name} manually reset`, {
        level: 'info',
        tags: { circuitBreaker: this.name, action: 'manual_reset' }
      });
    }
  }

  // Force state change for operational control
  forceState(newState: 'CLOSED' | 'OPEN' | 'HALF_OPEN') {
    const oldState = this.state;
    this.state = newState;
    this.stateChangeTime = Date.now();

    if (newState === 'CLOSED') {
      this.failures = 0;
      this.consecutiveFailures = 0;
    } else if (newState === 'OPEN') {
      this.lastFailTime = Date.now();
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
      this.consecutiveSuccesses = 0;
    }

    console.log(`[CircuitBreaker:${this.name}] Force state change: ${oldState} -> ${newState}`);

    if (Sentry.captureMessage) {
      Sentry.captureMessage(`Circuit breaker ${this.name} force state change`, {
        level: 'warning',
        tags: { circuitBreaker: this.name, action: 'force_state_change', stateTransition: `${oldState}_TO_${newState}` },
        extra: { oldState, newState }
      });
    }
  }
}

// Enhanced retry with exponential backoff, jitter, budget management, and error classification
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
    retryBudget?: { maxConcurrentRetries?: number; windowMs?: number };
    circuitBreaker?: CircuitBreaker;
    name?: string;
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
    onRetry,
    retryBudget,
    circuitBreaker,
    name = 'retry'
  } = options;

  // Check circuit breaker if provided
  if (circuitBreaker) {
    return circuitBreaker.execute(async () => {
      return performRetry(fn, { ...options, name });
    });
  }

  return performRetry(fn, { ...options, name });

  async function performRetry<T>(
    fn: () => Promise<T>,
    opts: typeof options & { name: string }
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000, backoffMultiplier = 2, jitter = true, retryCondition, onRetry, retryBudget, name } = opts;

    let lastError: Error | undefined;
    let budgetUsed = 0;

    // Initialize retry budget tracking
    const budget = retryBudget ? {
      maxConcurrentRetries: retryBudget.maxConcurrentRetries || 10,
      windowMs: retryBudget.windowMs || 60000,
      attempts: [] as number[]
    } : null;

    for (let i = 0; i <= (maxRetries || 3); i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Check if we should retry this error
        if (i === (maxRetries || 3) || !retryCondition!(lastError)) {
          break;
        }

        // Check retry budget
        if (budget) {
          const now = Date.now();
          // Remove old attempts outside the window
          budget.attempts = budget.attempts.filter(time => now - time < budget.windowMs);

          if (budget.attempts.length >= budget.maxConcurrentRetries) {
            console.warn(`[Retry:${name}] Retry budget exceeded, skipping retry`);
            break;
          }

          budget.attempts.push(now);
          budgetUsed++;
        }

        // Calculate delay with exponential backoff
        let delay = Math.min((baseDelay || 1000) * Math.pow(backoffMultiplier || 2, i), maxDelay || 30000);

        // Add jitter to prevent thundering herd
        if (jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }

        console.warn(`[Retry:${name}] Attempt ${i + 1} failed, retrying in ${Math.round(delay)}ms:`, lastError.message);

        // Call retry callback if provided
        if (onRetry) {
          onRetry(lastError, i + 1);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Log final failure with context
    if (lastError) {
      console.error(`[Retry:${name}] All ${(maxRetries || 3) + 1} attempts failed:`, lastError);
      Sentry.captureException(lastError, {
        tags: {
          retryFailed: 'true',
          attempts: (maxRetries || 3) + 1,
          retryName: name,
          budgetUsed: budgetUsed.toString()
        },
        extra: {
          finalError: lastError.message,
          retryBudget: budget ? JSON.stringify(budget) : 'none'
        }
      });

      throw lastError;
    }

    throw new Error('Unknown error occurred during retry');
  }
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

// Enhanced graceful degradation with circuit breakers and metrics
export function withGracefulDegradation<T>(
  primaryFn: () => Promise<T>,
  fallbackFns: Array<() => Promise<T>>,
  options: {
    name?: string;
    timeout?: number;
    circuitBreaker?: CircuitBreaker;
    metrics?: boolean;
    onFallback?: (level: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    name = 'unnamed',
    timeout = 5000,
    circuitBreaker,
    metrics = true,
    onFallback
  } = options;

  async function executeWithTimeout(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  async function tryWithCircuitBreaker(fn: () => Promise<T>, level: number): Promise<T> {
    if (circuitBreaker && level === 0) {
      return circuitBreaker.execute(fn);
    }
    return fn();
  }

  return executeWithTimeout(() => tryWithCircuitBreaker(primaryFn, 0), timeout)
    .catch(async (primaryError) => {
      console.warn(`[GracefulDegradation:${name}] Primary failed:`, primaryError.message);

      if (metrics) {
        // Track degradation metrics
        const metricsCollector = MetricsCollector.getInstance();
        metricsCollector.increment('graceful_degradation_fallback', 1, {
          service: name,
          level: 'primary'
        });
      }

      for (let i = 0; i < fallbackFns.length; i++) {
        try {
          console.log(`[GracefulDegradation:${name}] Trying fallback ${i + 1}`);

          if (onFallback) {
            onFallback(i + 1, primaryError);
          }

          const result = await executeWithTimeout(() => tryWithCircuitBreaker(fallbackFns[i], i + 1), timeout);

          if (metrics) {
            const metricsCollector = MetricsCollector.getInstance();
            metricsCollector.increment('graceful_degradation_success', 1, {
              service: name,
              level: (i + 1).toString()
            });
          }

          return result;
        } catch (fallbackError) {
          console.warn(`[GracefulDegradation:${name}] Fallback ${i + 1} failed:`, (fallbackError as Error).message);

          if (metrics) {
            const metricsCollector = MetricsCollector.getInstance();
            metricsCollector.increment('graceful_degradation_fallback', 1, {
              service: name,
              level: (i + 1).toString()
            });
          }
        }
      }

      // All options failed
      const finalError = new Error(`All options failed for ${name}. Primary: ${primaryError.message}`);

      if (metrics) {
        const metricsCollector = MetricsCollector.getInstance();
        metricsCollector.increment('graceful_degradation_total_failure', 1, {
          service: name
        });
      }

      Sentry.captureException(finalError, {
        tags: { gracefulDegradation: name, allFailed: 'true' },
        extra: {
          primaryError: primaryError.message,
          fallbackCount: fallbackFns.length,
          timeout
        }
      });

      throw finalError;
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