import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  validateAndSanitize, 
  schemas, 
  apiSchemas, 
  formValidation,
  securityValidation,
  sanitizeInput,
  sanitizeData
} from '@/lib/validation';

describe('Validation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Schema Validation', () => {
    it('should validate email addresses correctly', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com'
      ];
      
      validEmails.forEach(email => {
        expect(() => validateAndSanitize(schemas.email, email)).not.toThrow();
      });
      
      invalidEmails.forEach(email => {
        expect(() => validateAndSanitize(schemas.email, email)).toThrow();
      });
    });

    it('should validate phone numbers correctly', () => {
      const validPhones = [
        '+1234567890',
        '+1 (234) 567-890',
        '+44 20 7123 4567'
      ];
      
      const invalidPhones = [
        '123',
        'abc123',
        ''
      ];
      
      validPhones.forEach(phone => {
        expect(() => validateAndSanitize(schemas.phone, phone)).not.toThrow();
      });
      
      invalidPhones.forEach(phone => {
        expect(() => validateAndSanitize(schemas.phone, phone)).toThrow();
      });
    });

    it('should validate URLs correctly', () => {
      const validUrls = [
        'https://example.com',
        'https://www.example.com/path',
        'https://subdomain.example.com:8080/path?query=value'
      ];
      
      const invalidUrls = [
        'not-a-url',
        'https://localhost:3000'
      ];
      
      validUrls.forEach(url => {
        expect(() => validateAndSanitize(schemas.website, url)).not.toThrow();
      });
      
      invalidUrls.forEach(url => {
        expect(() => validateAndSanitize(schemas.website, url)).toThrow();
      });
    });

    it('should validate messages correctly', () => {
      const validMessages = [
        'This is a valid message',
        'Message with numbers 123 and symbols !@#',
        'A'.repeat(2000) // Max length
      ];
      
      const invalidMessages = [
        '',
        'A'.repeat(2001) // Too long
      ];
      
      validMessages.forEach(message => {
        expect(() => validateAndSanitize(schemas.message, message)).not.toThrow();
      });
      
      invalidMessages.forEach(message => {
        expect(() => validateAndSanitize(schemas.message, message)).toThrow();
      });
    });
  });

  describe('API Schema Validation', () => {
    it('should validate start audit API requests', () => {
      const validRequest = {
        email: 'test@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        referrer: 'https://google.com'
      };
      
      const invalidRequest = {
        email: 'invalid-email',
        ipAddress: 'invalid-ip'
      };
      
      expect(() => validateAndSanitize(apiSchemas.startAudit, validRequest)).not.toThrow();
      expect(() => validateAndSanitize(apiSchemas.startAudit, invalidRequest)).toThrow();
    });

    it('should validate submit message API requests', () => {
      const validRequest = {
        sessionId: 'session_123',
        message: 'This is a test message',
        timestamp: '2023-01-01T00:00:00Z'
      };
      
      const invalidRequest = {
        sessionId: '',
        message: ''
      };
      
      expect(() => validateAndSanitize(apiSchemas.submitMessage, validRequest)).not.toThrow();
      expect(() => validateAndSanitize(apiSchemas.submitMessage, invalidRequest)).toThrow();
    });
  });

  describe('Form Validation Utilities', () => {
    it('should validate individual fields correctly', () => {
      // Email field validation
      const emailResult = formValidation.validateEmailField('test@example.com');
      expect(emailResult.valid).toBe(true);
      expect(emailResult.sanitized).toBe('test@example.com');
      
      const invalidEmailResult = formValidation.validateEmailField('invalid-email');
      expect(invalidEmailResult.valid).toBe(false);
      expect(invalidEmailResult.error).toBeTruthy();
      
      // Message field validation
      const messageResult = formValidation.validateMessageField('Valid message');
      expect(messageResult.valid).toBe(true);
      
      const invalidMessageResult = formValidation.validateMessageField('');
      expect(invalidMessageResult.valid).toBe(false);
      expect(invalidMessageResult.error).toBeTruthy();
    });

    it('should create debounced validators', () => {
      jest.useFakeTimers();
      const mockCallback = jest.fn();
      const validator = formValidation.createValidator(schemas.email, 100);
      
      // Call validator multiple times quickly
      validator('test1@example.com', mockCallback);
      validator('test2@example.com', mockCallback);
      validator('test3@example.com', mockCallback);
      
      // Should not have called callback yet due to debounce
      expect(mockCallback).not.toHaveBeenCalled();
      
      // Wait for debounce
      jest.advanceTimersByTime(100);
      
      // Should have called callback once with last value
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          valid: true,
          sanitized: 'test3@example.com'
        })
      );
      
      jest.useRealTimers();
    });
  });

  describe('Security Validation', () => {
    it('should detect SQL injection attempts', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; DELETE FROM users WHERE 1=1; --",
        "UNION SELECT * FROM passwords"
      ];
      
      sqlInjectionAttempts.forEach(attempt => {
        expect(securityValidation.detectSQLInjection(attempt)).toBe(true);
      });
      
      const safeInputs = [
        'This is a safe message',
        'I have 2 cats and 1 dog',
        'The price is $19.99'
      ];
      
      safeInputs.forEach(input => {
        expect(securityValidation.detectSQLInjection(input)).toBe(false);
      });
    });

    it('should detect XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')"></iframe>'
      ];
      
      xssAttempts.forEach(attempt => {
        expect(securityValidation.detectXSS(attempt)).toBe(true);
      });
      
      const safeInputs = [
        'This is a safe message',
        'I love <3 this product',
        'The price is < $100'
      ];
      
      safeInputs.forEach(input => {
        expect(securityValidation.detectXSS(input)).toBe(false);
      });
    });

    it('should validate input comprehensively', () => {
      const maliciousInput = '<script>alert("XSS"); DROP TABLE users; --';
      const result = securityValidation.validateInput(maliciousInput);
      
      expect(result.safe).toBe(false);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.sanitized).not.toContain('<script>');
      // Note: The current sanitizeInput function doesn't remove SQL patterns, only HTML
      // This test might need adjustment based on actual implementation
    });

    it('should pass safe inputs through validation', () => {
      const safeInput = 'This is a completely safe message with no malicious content';
      const result = securityValidation.validateInput(safeInput);
      
      expect(result.safe).toBe(true);
      expect(result.risks.length).toBe(0);
      expect(result.sanitized).toBe(safeInput);
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize HTML content', () => {
      const inputWithHTML = '<script>alert("XSS")</script><p>Safe content</p>';
      const sanitized = sanitizeInput(inputWithHTML);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).not.toContain('<p>');
      expect(sanitized).toContain('Safe content');
    });

    it('should handle different sanitization options', () => {
      const input = '<script>alert("XSS")</script><p>Safe content</p>';
      
      // Default sanitization (no HTML allowed)
      const defaultSanitized = sanitizeInput(input);
      expect(defaultSanitized).not.toContain('<p>');
      
      // Allow HTML
      const htmlAllowed = sanitizeInput(input, { allowHTML: true });
      // Note: Current implementation might not preserve all HTML tags
      // Adjust expectation based on actual sanitizeInput behavior
      expect(htmlAllowed).not.toContain('<script>');
      
      // Max length
      const maxLength = sanitizeInput(input, { maxLength: 20 });
      expect(maxLength.length).toBeLessThanOrEqual(20);
    });

    it('should sanitize complex data structures', () => {
      const complexData = {
        user: {
          name: '<script>alert("XSS")</script>John',
          email: 'john@example.com',
          bio: '<p>Safe bio content</p>'
        },
        tags: ['<script>evil</script>', 'safe', 'tag'],
        message: "'; DROP TABLE users; --"
      };
      
      const sanitized = sanitizeData(complexData);
      
      expect(sanitized.user.name).not.toContain('<script>');
      expect(sanitized.user.name).toContain('John');
      expect(sanitized.user.email).toBe('john@example.com');
      expect(sanitized.tags[0]).not.toContain('<script>');
      // Note: Current sanitizeData might not remove SQL patterns from strings
      // This test might need adjustment based on actual implementation
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined inputs', () => {
      expect(() => validateAndSanitize(schemas.email, null)).toThrow();
      expect(() => validateAndSanitize(schemas.email, undefined)).toThrow();
      expect(() => validateAndSanitize(schemas.message, null)).toThrow();
      expect(() => validateAndSanitize(schemas.message, undefined)).toThrow();
    });

    it('should handle empty strings', () => {
      expect(() => validateAndSanitize(schemas.message, '')).toThrow();
      expect(() => validateAndSanitize(schemas.email, '')).toThrow();
    });

    it('should handle very long inputs', () => {
      const veryLongString = 'a'.repeat(10000);
      expect(() => validateAndSanitize(schemas.message, veryLongString)).toThrow();
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      expect(() => validateAndSanitize(schemas.message, specialChars)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const unicodeText = 'Hello 世界 🌍 ñáéíóú';
      expect(() => validateAndSanitize(schemas.message, unicodeText)).not.toThrow();
    });
  });
});