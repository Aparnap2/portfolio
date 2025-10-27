import { CircuitBreaker, withRetry, withErrorBoundary } from '@/lib/error-handling';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second timeout
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
    await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
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
});

describe('withRetry', () => {
  it('should retry failed operations', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('failure 1'))
      .mockRejectedValueOnce(new Error('failure 2'))
      .mockResolvedValueOnce('success');
    
    const result = await withRetry(mockFn, 3, 10);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('persistent failure'));
    
    await expect(withRetry(mockFn, 2, 10)).rejects.toThrow('persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
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
    const wrappedFn = withErrorBoundary(mockFn, fallbackFn);
    
    const result = wrappedFn();
    
    expect(result).toBe('fallback');
    expect(fallbackFn).toHaveBeenCalledTimes(1);
  });
});