/**
 * HubSpot API Contract Tests
 * Tests request/response formats and error handling contracts
 */

import {
  createOrUpdateHubSpotContact,
  createHubSpotDeal,
  createHubSpotTask
} from '@/lib/integrations/hubspot';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HubSpot API Contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HUBSPOT_ACCESS_TOKEN = 'test-hubspot-token';
    process.env.HUBSPOT_PORTAL_ID = '12345678';
  });

  afterEach(() => {
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    delete process.env.HUBSPOT_PORTAL_ID;
  });

  describe('Contact Creation/Update Contracts', () => {
    it('should send properly formatted contact search request', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '12345',
            properties: { email: 'john@example.com' }
          })
        });

      const contactData = {
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
        company: 'Tech Corp',
        phone: '+1-555-0123'
      };

      await createOrUpdateHubSpotContact(contactData);

      // Verify search request
      const searchCall = mockFetch.mock.calls[0];
      expect(searchCall[0]).toBe('https://api.hubapi.com/crm/v3/objects/contacts/search');
      expect(searchCall[1].method).toBe('POST');
      expect(searchCall[1].headers.Authorization).toBe('Bearer test-hubspot-token');

      const searchPayload = JSON.parse(searchCall[1].body);
      expect(searchPayload).toEqual({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: 'john@example.com'
          }]
        }],
        properties: ['email', 'firstname', 'lastname', 'company', 'phone']
      });
    });

    it('should send properly formatted contact creation request', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '12345',
            properties: { email: 'john@example.com' }
          })
        });

      const contactData = {
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
        company: 'Tech Corp'
      };

      await createOrUpdateHubSpotContact(contactData);

      // Verify creation request
      const createCall = mockFetch.mock.calls[1];
      expect(createCall[0]).toBe('https://api.hubapi.com/crm/v3/objects/contacts');
      expect(createCall[1].method).toBe('POST');

      const createPayload = JSON.parse(createCall[1].body);
      expect(createPayload.properties).toEqual({
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
        company: 'Tech Corp',
        hs_lead_status: 'NEW',
        lifecyclestage: 'lead'
      });
    });

    it('should send properly formatted contact update request', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            results: [{
              id: '67890',
              properties: { email: 'john@example.com' }
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '67890',
            properties: { email: 'john@example.com', firstname: 'John' }
          })
        });

      const contactData = {
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe'
      };

      await createOrUpdateHubSpotContact(contactData);

      // Verify update request
      const updateCall = mockFetch.mock.calls[1];
      expect(updateCall[0]).toBe('https://api.hubapi.com/crm/v3/objects/contacts/67890');
      expect(updateCall[1].method).toBe('PATCH');

      const updatePayload = JSON.parse(updateCall[1].body);
      expect(updatePayload.properties).toEqual({
        email: 'john@example.com',
        firstname: 'John',
        lastname: 'Doe',
        hs_lead_status: 'NEW',
        lifecyclestage: 'lead'
      });
    });
  });

  describe('Deal Creation Contracts', () => {
    it('should send properly formatted deal creation request', async () => {
      // Mock contact creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'contact-123',
          properties: {}
        })
      });

      // Mock deal creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'deal-456',
          properties: {}
        })
      });

      // Mock association creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const dealData = {
        email: 'jane@example.com',
        name: 'Jane Smith',
        company: 'Innovate Ltd',
        dealValue: 50000,
        painScore: 80,
        auditUrl: 'https://audit.example.com/report/123',
        timeline: '2 months',
        budgetRange: '$25k-50k'
      };

      await createHubSpotDeal(dealData);

      // Verify deal creation request
      const dealCall = mockFetch.mock.calls[2];
      expect(dealCall[0]).toBe('https://api.hubapi.com/crm/v3/objects/deals');
      expect(dealCall[1].method).toBe('POST');

      const dealPayload = JSON.parse(dealCall[1].body);
      expect(dealPayload.properties).toEqual({
        dealname: 'AI Automation Opportunity - Innovate Ltd',
        amount: 50000,
        dealstage: 'appointmentscheduled',
        pipeline: 'default',
        description: 'Pain Score: 80/100\nTimeline: 2 months\nBudget: $25k-50k\n\nAudit Report: https://audit.example.com/report/123'
      });
    });

    it('should send properly formatted contact-deal association request', async () => {
      // Mock contact creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'contact-123',
          properties: {}
        })
      });

      // Mock deal creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'deal-456',
          properties: {}
        })
      });

      // Mock association creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      await createHubSpotDeal({
        email: 'test@example.com',
        auditUrl: 'https://audit.example.com/report/123'
      });

      // Verify association request
      const associationCall = mockFetch.mock.calls[3];
      expect(associationCall[0]).toBe('https://api.hubapi.com/crm/v3/associations/CONTACT/DEAL/batch/create');
      expect(associationCall[1].method).toBe('POST');

      const associationPayload = JSON.parse(associationCall[1].body);
      expect(associationPayload.inputs).toEqual([{
        fromObjectId: 'contact-123',
        toObjectId: 'deal-456',
        type: 3 // CONTACT_TO_DEAL_ASSOCIATION_TYPE
      }]);
    });
  });

  describe('Task Creation Contracts', () => {
    it('should send properly formatted task creation request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'task-789',
          properties: {}
        })
      });

      const taskData = {
        contactId: 'contact-123',
        subject: 'Follow up on AI audit results',
        notes: 'Customer showed high interest in automation opportunities',
        dueDate: '2024-02-01T10:00:00Z'
      };

      await createHubSpotTask(taskData);

      const taskCall = mockFetch.mock.calls[0];
      expect(taskCall[0]).toBe('https://api.hubapi.com/crm/v3/objects/tasks');
      expect(taskCall[1].method).toBe('POST');

      const taskPayload = JSON.parse(taskCall[1].body);
      expect(taskPayload.properties).toEqual({
        hs_task_subject: 'Follow up on AI audit results',
        hs_task_body: 'Customer showed high interest in automation opportunities',
        hs_task_priority: 'HIGH',
        hs_task_status: 'NOT_STARTED',
        hs_timestamp: '2024-02-01T10:00:00Z'
      });

      expect(taskPayload.associations).toEqual([{
        to: { id: 'contact-123' },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 204
        }]
      }]);
    });
  });

  describe('Response Format Contracts', () => {
    it('should return properly formatted success response for contact creation', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '12345',
            properties: { email: 'test@example.com' }
          })
        });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com',
        firstname: 'Test'
      });

      expect(result).toEqual({
        success: true,
        contactId: '12345',
        contact: {
          id: '12345',
          properties: { email: 'test@example.com' }
        }
      });
    });

    it('should return properly formatted success response for deal creation', async () => {
      // Mock contact creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] })
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'contact-123',
          properties: {}
        })
      });

      // Mock deal creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'deal-456',
          properties: {}
        })
      });

      // Mock association
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const result = await createHubSpotDeal({
        email: 'test@example.com',
        auditUrl: 'https://audit.example.com/report/123'
      });

      expect(result).toEqual({
        success: true,
        dealId: 'deal-456',
        dealUrl: 'https://app.hubspot.com/contacts/12345678/deal/deal-456',
        contactId: 'contact-123'
      });
    });

    it('should return error response for API failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Failed to update contact')
      });
    });

    it('should return error response for missing configuration', async () => {
      delete process.env.HUBSPOT_ACCESS_TOKEN;

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result).toEqual({
        success: false,
        error: 'HubSpot not configured'
      });
    });
  });

  describe('Error Handling Contracts', () => {
    it('should handle authentication errors (401)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update contact');
    });

    it('should handle rate limiting (429)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update contact');
    });

    it('should handle server errors (5xx)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update contact');
    });

    it('should handle validation errors (400)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'invalid-email'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update contact');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result).toEqual({
        success: false,
        error: 'Network timeout'
      });
    });
  });

  describe('Data Validation Contracts', () => {
    it('should handle missing required fields', async () => {
      // Email is required for contact creation
      await expect(createOrUpdateHubSpotContact({} as any)).rejects.toThrow();
    });

    it('should handle extreme values gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '12345',
            properties: {}
          })
        });

      const extremeData = {
        email: 'test@example.com',
        firstname: 'A'.repeat(1000), // Very long name
        lastname: 'B'.repeat(1000),
        company: 'C'.repeat(500), // Very long company
        phone: '+1' + '2'.repeat(50) // Very long phone
      };

      const result = await createOrUpdateHubSpotContact(extremeData);

      expect(result.success).toBe(true);
      // HubSpot API should handle the validation/length limits
    });

    it('should handle special characters in text fields', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '12345',
            properties: {}
          })
        });

      const specialCharData = {
        email: 'test@example.com',
        firstname: 'José María',
        lastname: 'O\'Connor-Smith',
        company: 'Tech & Co. (Division)',
        phone: '+1 (555) 123-4567'
      };

      const result = await createOrUpdateHubSpotContact(specialCharData);

      expect(result.success).toBe(true);

      // Verify the data was sent correctly
      const createCall = mockFetch.mock.calls[1];
      const payload = JSON.parse(createCall[1].body);
      expect(payload.properties.firstname).toBe('José María');
      expect(payload.properties.lastname).toBe('O\'Connor-Smith');
      expect(payload.properties.company).toBe('Tech & Co. (Division)');
    });

    it('should handle null/undefined optional fields', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '12345',
            properties: {}
          })
        });

      const nullData = {
        email: 'test@example.com',
        firstname: undefined,
        lastname: null,
        company: undefined,
        phone: null
      };

      const result = await createOrUpdateHubSpotContact(nullData);

      expect(result.success).toBe(true);

      // Verify null/undefined fields are handled
      const createCall = mockFetch.mock.calls[1];
      const payload = JSON.parse(createCall[1].body);
      expect(payload.properties.firstname).toBeUndefined();
      expect(payload.properties.lastname).toBeNull();
    });
  });

  describe('Rate Limiting and Quota Contracts', () => {
    it('should handle rate limit responses with retry-after headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['retry-after', '60']]),
        statusText: 'Too Many Requests'
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update contact');
    });

    it('should handle quota exceeded errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Quota exceeded'
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update contact');
    });
  });

  describe('Backward Compatibility Contracts', () => {
    it('should maintain compatibility with existing API versions', async () => {
      // Test with minimal data that older versions might send
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ results: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: '12345',
            properties: { email: 'legacy@example.com' }
          })
        });

      const legacyData = {
        email: 'legacy@example.com'
        // No other fields - older versions might only send email
      };

      const result = await createOrUpdateHubSpotContact(legacyData);

      expect(result.success).toBe(true);
      expect(result.contactId).toBe('12345');
    });

    it('should handle API version changes gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('API version deprecated')
      });

      const result = await createOrUpdateHubSpotContact({
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update contact');
    });
  });
});