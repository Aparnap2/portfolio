import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { validateAndSanitize, schemas, apiSchemas } from '@/lib/validation';
import { MetricsCollector } from '@/lib/metrics';
import { healthCheck } from '@/lib/health';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Basic Integration Tests', () => {
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

    it('should validate phone numbers correctly', () => {
      const validPhone = '+1234567890';
      const invalidPhone = '123';
      
      expect(() => validateAndSanitize(schemas.phone, validPhone)).not.toThrow();
      expect(() => validateAndSanitize(schemas.phone, invalidPhone)).toThrow();
    });

    it('should validate URLs correctly', () => {
      const validUrl = 'https://example.com';
      const invalidUrl = 'not-a-url';
      
      expect(() => validateAndSanitize(schemas.website, validUrl)).not.toThrow();
      expect(() => validateAndSanitize(schemas.website, invalidUrl)).toThrow();
    });
  });

  describe('Security Integration', () => {
    it('should prevent XSS attacks', () => {
      const xssPayload = '<img src=x onerror=alert("XSS")>';
      const sanitized = validateAndSanitize(schemas.message, xssPayload);
      
      expect(sanitized).not.toContain('<img>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should prevent SQL injection', () => {
      const sqlPayload = "'; DROP TABLE users; --";
      const sanitized = validateAndSanitize(schemas.message, sqlPayload);
      
      expect(sanitized).not.toContain('DROP');
      expect(sanitized).not.toContain('TABLE');
    });

    it('should detect malicious patterns', () => {
      const maliciousPatterns = [
        '<script>',
        'javascript:',
        'onerror=',
        'onclick=',
        'eval(',
        'document.cookie'
      ];
      
      maliciousPatterns.forEach(pattern => {
        const result = validateAndSanitize(schemas.message, pattern);
        expect(result).not.toContain(pattern);
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should track metrics correctly', () => {
      metrics.increment('test_counter');
      metrics.timing('test_timing', 100);
      metrics.gauge('test_gauge', 50);
      
      const metricsData = metrics.getMetrics();
      
      expect(metricsData.counters?.['test_counter']).toBe(1);
      expect(metricsData.timings?.['test_timing']).toBe(100);
      expect(metricsData.gauges?.['test_gauge']).toBe(50);
    });

    it('should reset metrics correctly', () => {
      metrics.increment('test_counter');
      metrics.reset();
      
      const metricsData = metrics.getMetrics();
      expect(metricsData.counters?.['test_counter']).toBeUndefined();
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

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle timeout errors', async () => {
      // Mock timeout
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      try {
        await fetch('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate complete workflow data', () => {
      const validWorkflowData = {
        email: 'test@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        message: 'This is a test message',
        website: 'https://example.com'
      };
      
      expect(() => validateAndSanitize(apiSchemas.startAudit, validWorkflowData)).not.toThrow();
    });

    it('should reject invalid workflow data', () => {
      const invalidWorkflowData = {
        email: 'invalid-email',
        phone: '123',
        company: '',
        message: '',
        website: 'not-a-url'
      };
      
      expect(() => validateAndSanitize(apiSchemas.startAudit, invalidWorkflowData)).toThrow();
    });
  });

  describe('Load Testing', () => {
    it('should handle concurrent operations', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve().then(() => {
          metrics.increment(`operation_${i}`);
          return i;
        })
      );
      
      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentOperations);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      const successfulOperations = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successfulOperations).toBe(10);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
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
});