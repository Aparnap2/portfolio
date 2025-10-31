import { CircuitBreaker, withRetry, withErrorBoundary, withGracefulDegradation, ErrorRecovery } from '@/lib/error-handling';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({ threshold: 3, timeout: 1000, name: 'test' });
  });

  it('should execute function successfully when circuit is closed', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await circuitBreaker.execute(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should open circuit after threshold failures', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('failure'));

    // Trigger failures to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn);
      } catch (error) {
        // Expected failures
      }
    }

    // Circuit should be open now
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker test is OPEN');
  });

  it('should transition to half-open after timeout', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockRejectedValueOnce(new Error('failure'))
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValueOnce('success');

    // Open the circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(mockFn);
      } catch (error) {
        // Expected failures
      }
    }

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Should work again
    const result = await circuitBreaker.execute(mockFn);
    expect(result).toBe('success');
  });

  it('should provide state information', () => {
    const state = circuitBreaker.getState();

    expect(state).toHaveProperty('state');
    expect(state).toHaveProperty('failures');
    expect(state).toHaveProperty('successCount');
    expect(state).toHaveProperty('requestCount');
    expect(state.state).toBe('CLOSED');
  });

  it('should allow manual reset', () => {
    // Manually set some state
    (circuitBreaker as any).failures = 5;
    (circuitBreaker as any).state = 'OPEN';

    circuitBreaker.reset();

    const state = circuitBreaker.getState();
    expect(state.failures).toBe(0);
    expect(state.state).toBe('CLOSED');
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should retry failed operations with exponential backoff', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('failure 1'))
      .mockRejectedValueOnce(new Error('failure 2'))
      .mockResolvedValueOnce('success');

    const retryPromise = withRetry(mockFn, { maxRetries: 3, baseDelay: 100 });

    // Fast-forward through the delays
    await jest.advanceTimersByTimeAsync(100); // First retry delay
    await jest.advanceTimersByTimeAsync(200); // Second retry delay

    const result = await retryPromise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('persistent failure'));

    const retryPromise = withRetry(mockFn, { maxRetries: 2, baseDelay: 10 });

    await jest.advanceTimersByTimeAsync(1000); // Fast-forward all delays

    await expect(retryPromise).rejects.toThrow('persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should respect retry condition', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('validation error'));

    const retryPromise = withRetry(mockFn, {
      maxRetries: 3,
      baseDelay: 10,
      retryCondition: (error) => !error.message.includes('validation')
    });

    await expect(retryPromise).rejects.toThrow('validation error');
    expect(mockFn).toHaveBeenCalledTimes(1); // Should not retry validation errors
  });

  it('should call onRetry callback', async () => {
    const onRetry = jest.fn();
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('failure'))
      .mockResolvedValueOnce('success');

    const retryPromise = withRetry(mockFn, {
      maxRetries: 1,
      baseDelay: 10,
      onRetry
    });

    await jest.advanceTimersByTimeAsync(100);

    await retryPromise;

    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });
});

describe('withErrorBoundary', () => {
  it('should execute function normally when no error', () => {
    const mockFn = jest.fn().mockReturnValue('success');
    const wrappedFn = withErrorBoundary(mockFn);

    const result = wrappedFn();

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should use fallback when function throws', () => {
    const mockFn = jest.fn().mockImplementation(() => {
      throw new Error('test error');
    });
    const fallbackFn = jest.fn().mockReturnValue('fallback');
    const wrappedFn = withErrorBoundary(mockFn, { fallback: fallbackFn });

    const result = wrappedFn();

    expect(result).toBe('fallback');
    expect(fallbackFn).toHaveBeenCalledTimes(1);
  });

  it('should handle async functions', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('async error'));
    const fallbackFn = jest.fn().mockResolvedValue('async fallback');
    const wrappedFn = withErrorBoundary(mockFn, { fallback: fallbackFn });

    const result = await wrappedFn();

    expect(result).toBe('async fallback');
  });

  it('should call onError callback', () => {
    const onError = jest.fn();
    const mockFn = jest.fn().mockImplementation(() => {
      throw new Error('test error');
    });
    const wrappedFn = withErrorBoundary(mockFn, { onError, name: 'test' });

    try {
      wrappedFn('arg1', 'arg2');
    } catch (error) {
      // Expected
    }

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ args: ['arg1', 'arg2'] })
    );
  });

  it('should classify errors correctly', () => {
    const mockFn = jest.fn().mockImplementation(() => {
      throw new Error('Circuit breaker is OPEN');
    });
    const wrappedFn = withErrorBoundary(mockFn);

    expect(() => wrappedFn()).toThrow();
    // Error should be classified as transient and handled
  });
});

describe('withGracefulDegradation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should use primary function when successful', async () => {
    const primary = jest.fn().mockResolvedValue('primary success');
    const fallback = jest.fn().mockResolvedValue('fallback');

    const result = await withGracefulDegradation(primary, [fallback]);

    expect(result).toBe('primary success');
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('should fallback when primary fails', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('primary failed'));
    const fallback = jest.fn().mockResolvedValue('fallback success');

    const result = await withGracefulDegradation(primary, [fallback]);

    expect(result).toBe('fallback success');
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('should try multiple fallbacks in order', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('primary failed'));
    const fallback1 = jest.fn().mockRejectedValue(new Error('fallback1 failed'));
    const fallback2 = jest.fn().mockResolvedValue('fallback2 success');

    const result = await withGracefulDegradation(primary, [fallback1, fallback2]);

    expect(result).toBe('fallback2 success');
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback1).toHaveBeenCalledTimes(1);
    expect(fallback2).toHaveBeenCalledTimes(1);
  });

  it('should respect timeout', async () => {
    const slowPrimary = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('slow'), 10000))
    );
    const fastFallback = jest.fn().mockResolvedValue('fast fallback');

    const result = await withGracefulDegradation(slowPrimary, [fastFallback], { timeout: 100 });

    await jest.advanceTimersByTimeAsync(200);

    expect(result).toBe('fast fallback');
  });
});

describe('ErrorRecovery', () => {
  describe('isRecoverable', () => {
    it('should identify recoverable errors', () => {
      expect(ErrorRecovery.isRecoverable(new Error('Network timeout'))).toBe(true);
      expect(ErrorRecovery.isRecoverable(new Error('Connection failed'))).toBe(true);
      expect(ErrorRecovery.isRecoverable(new Error('Circuit breaker is OPEN'))).toBe(true);
      expect(ErrorRecovery.isRecoverable(new Error('502 Bad Gateway'))).toBe(true);
      expect(ErrorRecovery.isRecoverable(new Error('Rate limit exceeded'))).toBe(true);
    });

    it('should identify non-recoverable errors', () => {
      expect(ErrorRecovery.isRecoverable(new Error('Validation failed'))).toBe(false);
      expect(ErrorRecovery.isRecoverable(new Error('Invalid input'))).toBe(false);
      expect(ErrorRecovery.isRecoverable(new Error('Permission denied'))).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return appropriate delays for different error types', () => {
      expect(ErrorRecovery.getRetryDelay(new Error('Rate limit exceeded'), 1000)).toBe(10000);
      expect(ErrorRecovery.getRetryDelay(new Error('Timeout occurred'), 1000)).toBe(5000);
      expect(ErrorRecovery.getRetryDelay(new Error('Circuit breaker is OPEN'), 1000)).toBe(20000);
      expect(ErrorRecovery.getRetryDelay(new Error('Unknown error'), 1000)).toBe(1000);
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly messages', () => {
      expect(ErrorRecovery.getUserMessage(new Error('Validation failed'))).toBe('Please check your input and try again.');
      expect(ErrorRecovery.getUserMessage(new Error('Request timeout'))).toBe('Request timed out. Please try again.');
      expect(ErrorRecovery.getUserMessage(new Error('Network error'))).toBe('Network error. Please check your connection.');
      expect(ErrorRecovery.getUserMessage(new Error('Rate limit hit'))).toBe('Too many requests. Please wait and try again.');
      expect(ErrorRecovery.getUserMessage(new Error('Unknown error'))).toBe('Something went wrong. Please try again.');
    });
  });
});