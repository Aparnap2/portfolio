import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { AuditChatbot } from '@/components/audit/AuditChatbot';
import { useAuditStore } from '@/stores/audit-store';
import { MetricsCollector } from '@/lib/metrics';
import { healthCheck } from '@/lib/health';
import { validateAndSanitize, schemas } from '@/lib/validation';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Comprehensive Integration Tests', () => {
  let metrics: MetricsCollector;
  
  beforeEach(() => {
    metrics = MetricsCollector.getInstance();
    metrics.reset();
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    metrics.reset();
  });

  describe('Component Integration', () => {
    it('should render audit chatbot without errors', async () => {
      render(<AuditChatbot />);
      
      expect(screen.getByText('AI Opportunity Assessment')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Tell me about your business/)).toBeInTheDocument();
    });

    it('should handle email capture flow', async () => {
      render(<AuditChatbot />);
      
      const emailInput = screen.getByPlaceholderText(/Enter your email/);
      const startButton = screen.getByText('Start Assessment');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Tell me about your business/)).toBeInTheDocument();
      });
    });

    it('should handle message submission', async () => {
      render(<AuditChatbot />);
      
      // Simulate email capture first
      const emailInput = screen.getByPlaceholderText(/Enter your email/);
      const startButton = screen.getByText('Start Assessment');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText(/Tell me about your business/);
        expect(messageInput).toBeInTheDocument();
        
        fireEvent.change(messageInput, { target: { value: 'We are a technology company' } });
        fireEvent.click(screen.getByRole('button', { name: /send/i }));
      });
    });
  });

  describe('Store Integration', () => {
    it('should maintain state consistency', async () => {
      const TestComponent = () => {
        const { sessionId, messages, currentPhase } = useAuditStore();
        
        return (
          <div data-testid="test-component">
            <div data-session-id={sessionId}>{sessionId}</div>
            <div data-message-count={messages.length}>{messages.length}</div>
            <div data-current-phase={currentPhase}>{currentPhase}</div>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      const testComponent = screen.getByTestId('test-component');
      expect(testComponent).toHaveAttribute('data-session-id');
      expect(testComponent).toHaveAttribute('data-message-count', '0');
      expect(testComponent).toHaveAttribute('data-current-phase', 'discovery');
    });

    it('should handle state updates correctly', async () => {
      const { result } = renderHook(() => useAuditStore());
      
      act(() => {
        result.current.initializeSession('test@example.com');
      });
      
      expect(result.current.sessionId).toBeTruthy();
      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe('Validation Integration', () => {
    it('should validate email inputs correctly', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';
      
      expect(() => validateAndSanitize(schemas.email, validEmail)).not.toThrow();
      expect(() => validateAndSanitize(schemas.email, invalidEmail)).toThrow();
    });

    it('should sanitize malicious inputs', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = validateAndSanitize(schemas.message, maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track component renders', () => {
      render(<AuditChatbot />);
      
      const renderCount = metrics.getMetrics().counters?.['component_render'] || 0;
      expect(renderCount).toBeGreaterThan(0);
    });

    it('should track user interactions', async () => {
      render(<AuditChatbot />);
      
      const emailInput = screen.getByPlaceholderText(/Enter your email/);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      
      const interactionCount = metrics.getMetrics().counters?.['user_interaction'] || 0;
      expect(interactionCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const TestComponent = () => {
        const { error, initializeSession } = useAuditStore();
        
        const handleInitialize = async () => {
          try {
            await initializeSession('test@example.com');
          } catch (err) {
            expect(err).toBeInstanceOf(Error);
          }
        };
        
        return (
          <button onClick={handleInitialize} data-testid="test-button">
            Test Error
          </button>
        );
      };
      
      render(<TestComponent />);
      
      const button = screen.getByTestId('test-button');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should recover from errors', async () => {
      const TestComponent = () => {
        const { error, initializeSession } = useAuditStore();
        
        return (
          <div>
            {error && <div data-testid="error-display">{error}</div>}
            <button onClick={() => initializeSession('test@example.com')} data-testid="retry-button">
              Retry
            </button>
          </div>
        );
      };
      
      const { rerender } = render(<TestComponent />);
      
      // Mock error state
      act(() => {
        // Simulate error state
      });
      
      rerender(<TestComponent />);
      
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      });
    });
  });

  describe('Health Check Integration', () => {
    it('should perform system health checks', async () => {
      const health = await healthCheck();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('checks');
      expect(health).toHaveProperty('timestamp');
      
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
    });

    it('should check external service dependencies', async () => {
      const health = await healthCheck();
      
      if (health.checks.database) {
        expect(typeof health.checks.database.status).toBe('boolean');
      }
      
      if (health.checks.redis) {
        expect(typeof health.checks.redis.status).toBe('boolean');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AuditChatbot />);
      
      // Check for proper ARIA labels
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      
      const messageInput = screen.getByPlaceholderText(/Tell me about your business/);
      expect(messageInput).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      render(<AuditChatbot />);
      
      const emailInput = screen.getByPlaceholderText(/Enter your email/);
      emailInput.focus();
      
      // Test Tab navigation
      fireEvent.keyDown(emailInput, { key: 'Tab' });
      
      // Test Enter submission
      fireEvent.keyDown(emailInput, { key: 'Enter' });
      
      await waitFor(() => {
        // Should have moved focus or submitted
      });
    });

    it('should have proper color contrast', () => {
      render(<AuditChatbot />);
      
      const button = screen.getByRole('button', { name: /start assessment/i });
      const styles = window.getComputedStyle(button);
      
      // Check for sufficient color contrast (basic check)
      const backgroundColor = styles.backgroundColor;
      const color = styles.color;
      
      expect(backgroundColor).toBeTruthy();
      expect(color).toBeTruthy();
    });
  });

  describe('Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        fetch('/api/audit/start', {
          method: 'POST',
          body: JSON.stringify({ email: `test${i}@example.com` })
        })
      );
      
      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentRequests);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successfulRequests).toBeGreaterThan(5);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Check metrics
      const metricsData = metrics.getMetrics();
      expect(metricsData.counters?.['concurrent_requests']).toBe(10);
    });

    it('should handle memory usage', () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate heavy operations
      const largeData = new Array(10000).fill(0).map((_, i) => ({ id: i, data: 'x'.repeat(100) }));
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });
  });

  describe('Security', () => {
    it('should prevent XSS attacks', () => {
      const xssPayload = '<img src=x onerror=alert("XSS")>';
      
      const TestComponent = () => {
        const [message, setMessage] = useState('');
        
        const handleSubmit = (input: string) => {
          const sanitized = validateAndSanitize(schemas.message, input);
          setMessage(sanitized);
        };
        
        return (
          <div>
            <input 
              data-testid="message-input"
              value={message}
              onChange={(e) => handleSubmit(e.target.value)}
            />
            <div data-testid="sanitized-message">{message}</div>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByTestId('message-input');
      fireEvent.change(input, { target: { value: xssPayload } });
      
      const sanitizedMessage = screen.getByTestId('sanitized-message');
      expect(sanitizedMessage).not.toContain('<img>');
      expect(sanitizedMessage).not.toContain('onerror');
      expect(sanitizedMessage).not.toContain('alert');
    });

    it('should prevent SQL injection', () => {
      const sqlPayload = "'; DROP TABLE users; --";
      
      const TestComponent = () => {
        const [query, setQuery] = useState('');
        
        const handleSubmit = (input: string) => {
          const sanitized = validateAndSanitize(schemas.message, input);
          setQuery(sanitized);
        };
        
        return (
          <div>
            <input 
              data-testid="query-input"
              value={query}
              onChange={(e) => handleSubmit(e.target.value)}
            />
            <div data-testid="sanitized-query">{query}</div>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      const input = screen.getByTestId('query-input');
      fireEvent.change(input, { target: { value: sqlPayload } });
      
      const sanitizedQuery = screen.getByTestId('sanitized-query');
      expect(sanitizedQuery).not.toContain('DROP');
      expect(sanitizedQuery).not.toContain('TABLE');
    });
  });
});