import { POST } from '@/app/api/audit/answer/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('@/lib/validation', () => ({
  validateWorkflowData: jest.fn(),
  validateAndSanitize: jest.fn(),
  apiSchemas: {},
}));

const mockRedis = require('@/lib/redis').redis;
const mockValidateWorkflowData = require('@/lib/validation').validateWorkflowData;

describe('/api/audit/answer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateWorkflowData.mockReturnValue({ valid: true });
  });

  describe('POST - Success Scenarios', () => {
    it('should process discovery step answers', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'We are a SaaS company with 50 employees. We find customers through marketing and deliver our service through a platform.',
      };

      const currentState = {
        current_step: 'discovery',
        extracted_info: {
          discovery: null,
          pain_points: null,
          contact_info: null,
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('discovery');
      expect(result.response.messages).toHaveLength(2); // User message + AI response
      expect(result.response.extracted_info.discovery).toBeDefined();
    });

    it('should transition from discovery to pain_points when complete', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'We are a marketing agency with 25 employees. We acquire customers through inbound marketing and deliver services through consulting.',
      };

      const currentState = {
        current_step: 'discovery',
        extracted_info: {
          discovery: {
            industry: 'marketing',
            companySize: '25 employees',
            acquisitionFlow: 'inbound marketing',
          },
          pain_points: null,
          contact_info: null,
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('pain_points');
      expect(result.response.messages).toHaveLength(2);
    });

    it('should process pain points step answers', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'Manual data entry takes 10 hours per week. We have bottlenecks in approval processes and data silos between our CRM and accounting systems.',
      };

      const currentState = {
        current_step: 'pain_points',
        extracted_info: {
          discovery: {
            industry: 'saas',
            companySize: '50 employees',
            acquisitionFlow: 'marketing',
            deliveryFlow: 'platform',
          },
          pain_points: null,
          contact_info: null,
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('pain_points');
      expect(result.response.extracted_info.pain_points).toBeDefined();
    });

    it('should transition to contact_info when pain_points complete', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'We have a budget of $50,000 and need implementation within 3 months. I am the CEO.',
      };

      const currentState = {
        current_step: 'pain_points',
        extracted_info: {
          discovery: {
            industry: 'saas',
            companySize: '50 employees',
            acquisitionFlow: 'marketing',
            deliveryFlow: 'platform',
          },
          pain_points: {
            manualTasks: 'data entry',
            bottlenecks: 'approvals',
            dataSilos: 'CRM and accounting',
            budget: '$50,000',
            timeline: '3 months',
          },
          contact_info: null,
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('contact_info');
    });

    it('should process contact info and complete workflow', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'My name is John Doe and my email is john@example.com. I work at TechCorp.',
      };

      const currentState = {
        current_step: 'contact_info',
        extracted_info: {
          discovery: {
            industry: 'saas',
            companySize: '50 employees',
            acquisitionFlow: 'marketing',
            deliveryFlow: 'platform',
          },
          pain_points: {
            manualTasks: 'data entry',
            bottlenecks: 'approvals',
            dataSilos: 'CRM and accounting',
            budget: '$50,000',
            timeline: '3 months',
            userRole: 'CEO',
          },
          contact_info: null,
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('ready_for_generation');
      expect(result.response.conversation_complete).toBe(true);
      expect(result.response.needs_email).toBe(true);
    });

    it('should handle continuation choice - continue previous audit', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'Continue with my previous audit',
      };

      const currentState = {
        current_step: 'continuation_choice',
        extracted_info: {
          discovery: { industry: 'tech' },
          pain_points: { manualTasks: 'data entry' },
          contact_info: { email: 'test@example.com' },
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('ready_for_generation');
    });

    it('should handle continuation choice - start fresh', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'Start a fresh audit',
      };

      const currentState = {
        current_step: 'continuation_choice',
        extracted_info: {
          discovery: { industry: 'tech' },
          pain_points: { manualTasks: 'data entry' },
          contact_info: { email: 'test@example.com' },
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('discovery');
      expect(result.response.extracted_info.discovery).toBeNull();
    });

    it('should handle email capture', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'user@example.com',
      };

      const currentState = {
        current_step: 'email_request',
        extracted_info: {
          discovery: { industry: 'tech' },
          pain_points: { manualTasks: 'data entry' },
          contact_info: { name: 'John Doe' },
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.response.current_step).toBe('ready_for_generation');
      expect(result.response.email).toBe('user@example.com');
    });
  });

  describe('POST - Validation and Error Handling', () => {
    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'test' }),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should return 404 for non-existent session', async () => {
      const requestBody = {
        sessionId: 'non-existent-session',
        message: 'Hello',
      };

      mockRedis.get.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found or expired');
    });

    it('should handle Redis errors gracefully', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'Hello',
      };

      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
    });

    it('should handle invalid JSON in request', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
    });
  });

  describe('POST - Data Extraction and Validation', () => {
    it('should extract industry from message', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'We are a software company',
      };

      const currentState = {
        current_step: 'discovery',
        extracted_info: {
          discovery: null,
          pain_points: null,
          contact_info: null,
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      // Verify that industry was extracted
      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:test-session-id',
        expect.stringContaining('"industry":"software"')
      );
    });

    it('should extract email from message', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'Contact me at john.doe@example.com',
      };

      const currentState = {
        current_step: 'contact_info',
        extracted_info: {
          discovery: { industry: 'tech' },
          pain_points: { manualTasks: 'data entry' },
          contact_info: null,
        },
        messages: [],
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      await POST(request);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:test-session-id',
        expect.stringContaining('"email":"john.doe@example.com"')
      );
    });

    it('should validate workflow data', async () => {
      const requestBody = {
        sessionId: 'test-session-id',
        message: 'Test message',
      };

      const currentState = {
        current_step: 'discovery',
        extracted_info: {
          discovery: { industry: 'invalid' },
          pain_points: null,
          contact_info: null,
        },
        messages: [],
      };

      mockValidateWorkflowData.mockReturnValue({
        valid: false,
        errors: ['Invalid industry']
      });

      mockRedis.get.mockResolvedValue(JSON.stringify(currentState));

      const request = new NextRequest('http://localhost:3000/api/audit/answer', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.response.validation_status).toBe('invalid');
      expect(result.response.validation_errors).toEqual(['Invalid industry']);
    });
  });
});