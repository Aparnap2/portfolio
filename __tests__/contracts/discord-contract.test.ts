/**
 * Discord Webhook Contract Tests
 * Tests request/response formats and error handling contracts
 */

import { sendDiscordAlert, sendDiscordSystemAlert, sendDiscordCompletionNotification } from '@/lib/integrations/discord';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Discord Webhook Contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test/webhook';
  });

  afterEach(() => {
    delete process.env.DISCORD_WEBHOOK_URL;
  });

  describe('Request Format Contracts', () => {
    it('should send properly formatted embed for lead alerts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      const leadData = {
        sessionId: 'test-session-123',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Tech Corp',
        painScore: 85,
        estimatedValue: 50000,
        timeline: '3 months',
        budgetRange: '$50k-100k',
        topOpportunity: 'Process Automation - Save $15k/month',
        googleDocUrl: 'https://docs.google.com/document/test'
      };

      await sendDiscordAlert(leadData);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://discord.com/api/webhooks/test/webhook');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');

      const payload = JSON.parse(options.body);

      // Validate embed structure
      expect(payload).toHaveProperty('embeds');
      expect(Array.isArray(payload.embeds)).toBe(true);
      expect(payload.embeds).toHaveLength(1);

      const embed = payload.embeds[0];
      expect(embed).toHaveProperty('title', '🎯 New AI Audit Lead');
      expect(embed).toHaveProperty('color'); // Pain score color
      expect(embed).toHaveProperty('fields');
      expect(Array.isArray(embed.fields)).toBe(true);
      expect(embed).toHaveProperty('footer');
      expect(embed.footer).toHaveProperty('text', 'Session ID: test-session-123');
      expect(embed).toHaveProperty('timestamp');

      // Validate fields structure
      const fields = embed.fields;
      expect(Array.isArray(fields)).toBe(true);
      expect(fields.length).toBeGreaterThanOrEqual(4);

      const contactField = fields.find((field: any) => field.name === '👤 Contact');
      expect(contactField).toEqual({
        name: '👤 Contact',
        value: '**Name:** John Doe\n**Email:** john@example.com\n**Company:** Tech Corp',
        inline: true
      });

      const qualificationField = fields.find((field: any) => field.name === '📊 Qualification');
      expect(qualificationField).toEqual({
        name: '📊 Qualification',
        value: '**Pain Score:** 85/100\n**Timeline:** 3 months\n**Budget:** $50k-100k',
        inline: true
      });

      const valueField = fields.find((field: any) => field.name === '💰 Value');
      expect(valueField).toEqual({
        name: '💰 Value',
        value: '**Estimated Value:** $50,000',
        inline: true
      });

      const topOpportunityField = fields.find((field: any) => field.name === '🚀 Top Opportunity');
      expect(topOpportunityField).toEqual({
        name: '🚀 Top Opportunity',
        value: 'Process Automation - Save $15k/month',
        inline: false
      });

      const docField = fields.find((field: any) => field.name === '📄 Full Report');
      expect(docField).toEqual({
        name: '📄 Full Report',
        value: '[View Google Doc](https://docs.google.com/document/test)',
        inline: false
      });
    });

    it('should include Google Doc link when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com',
        googleDocUrl: 'https://docs.google.com/test'
      });

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      const embed = payload.embeds[0];

      const docField = embed.fields.find((f: any) => f.name === '📄 Full Report');
      expect(docField).toEqual({
        name: '📄 Full Report',
        value: '[View Google Doc](https://docs.google.com/test)',
        inline: false
      });
    });

    it('should send properly formatted embed for system alerts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      const systemData = {
        message: 'Database connection failed',
        level: 'error' as const,
        context: {
          service: 'database',
          error: 'Connection timeout',
          timestamp: '2024-01-01T00:00:00Z'
        }
      };

      await sendDiscordSystemAlert(systemData);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);

      expect(payload.embeds).toHaveLength(1);
      const embed = payload.embeds[0];

      expect(embed.title).toBe('🚨 System Alert');
      expect(embed.color).toBe(0xff0000); // Red for error
      expect(embed.description).toBe('Database connection failed');
      expect(embed.fields).toHaveLength(3);

      expect(embed.fields).toEqual([
        { name: 'service', value: 'database', inline: true },
        { name: 'error', value: 'Connection timeout', inline: true },
        { name: 'timestamp', value: '2024-01-01T00:00:00Z', inline: true }
      ]);
    });

    it('should send properly formatted embed for completion notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      const completionData = {
        sessionId: 'session-123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        opportunities: [
          { name: 'Email Automation', difficulty: 'Easy', monthlySavings: 2500 },
          { name: 'Data Processing', difficulty: 'Medium', monthlySavings: 1800 },
          { name: 'Customer Support', difficulty: 'Hard', monthlySavings: 3200 }
        ],
        painScore: 78,
        estimatedValue: 75000
      };

      await sendDiscordCompletionNotification(completionData);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      const embed = payload.embeds[0];

      expect(embed.title).toBe('✅ AI Audit Completed');
      expect(embed.color).toBe(0x00ff00); // Green
      expect(embed.fields).toHaveLength(3);

      // Client field
      expect(embed.fields[0]).toEqual({
        name: '👤 Client',
        value: '**Name:** Jane Smith\n**Email:** jane@example.com',
        inline: true
      });

      // Results field
      expect(embed.fields[1]).toEqual({
        name: '📊 Results',
        value: '**Pain Score:** 78/100\n**Opportunities:** 3\n**Monthly Savings:** $7,500',
        inline: true
      });

      // Top opportunities field (limited to 3)
      expect(embed.fields[2]).toEqual({
        name: '🚀 Top Opportunities',
        value: '1. **Email Automation** (Easy) - $2,500/mo\n2. **Data Processing** (Medium) - $1,800/mo\n3. **Customer Support** (Hard) - $3,200/mo',
        inline: false
      });
    });
  });

  describe('Response Format Contracts', () => {
    it('should return success response for successful webhook calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result).toEqual({
        success: true,
        messageId: 'webhook-sent'
      });
    });

    it('should return error response for failed webhook calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request: Invalid payload')
      });

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result).toEqual({
        success: false,
        error: expect.stringContaining('Discord webhook failed')
      });
    });

    it('should return error response for network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result).toEqual({
        success: false,
        error: 'Network timeout'
      });
    });

    it('should return error response for missing configuration', async () => {
      delete process.env.DISCORD_WEBHOOK_URL;

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result).toEqual({
        success: false,
        error: 'Discord not configured'
      });
    });
  });

  describe('Error Handling Contracts', () => {
    it('should handle rate limiting (429) responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Too Many Requests')
      });

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Discord webhook failed');
    });

    it('should handle server errors (5xx) responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error')
      });

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Discord webhook failed');
    });

    it('should handle malformed webhook URLs', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://invalid-webhook-url.com';

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid webhook URL. Get it from: Channel Settings → Integrations → Webhooks");
    });

    it('should handle OAuth URLs instead of webhook URLs', async () => {
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/oauth2/authorize?client_id=123';

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid webhook URL. Get it from: Channel Settings → Integrations → Webhooks");
    });
  });

  describe('Data Validation Contracts', () => {
    it('should handle missing required fields', async () => {
      // Missing required fields - should still attempt to send
      const incompleteData = {
        sessionId: 'test-123'
        // Missing name, email
      };

      await expect(sendDiscordAlert(incompleteData as any)).rejects.toThrow();
      // This would throw because of TypeScript, but in runtime it would attempt to send
    });

    it('should handle extreme values gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      const extremeData = {
        sessionId: 'test-123',
        name: 'A'.repeat(1000), // Very long name
        email: 'test@example.com',
        painScore: 999, // Invalid pain score
        estimatedValue: Number.MAX_SAFE_INTEGER,
        company: 'A'.repeat(500), // Very long company name
        timeline: 'A'.repeat(200), // Very long timeline
        budgetRange: 'A'.repeat(100), // Very long budget
        topOpportunity: 'A'.repeat(1000), // Very long opportunity
        googleDocUrl: 'https://docs.google.com/' + 'a'.repeat(1000) // Very long URL
      };

      await sendDiscordAlert(extremeData);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.embeds).toHaveLength(1);
      // Should handle the data without crashing
    });

    it('should handle special characters in text fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      const specialCharData = {
        sessionId: 'test-123',
        name: 'José María ñoño',
        email: 'test@example.com',
        company: 'Tech & Co. (Division)',
        painScore: 75,
        timeline: 'ASAP - Q1 2024',
        budgetRange: '$50k - $100k+',
        topOpportunity: 'Process Automation (ROI: 300% 📈)'
      };

      await sendDiscordAlert(specialCharData);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.embeds[0].fields[0].value).toContain('José María ñoño');
      expect(payload.embeds[0].fields[1].value).toContain('ASAP - Q1 2024');
    });

    it('should handle null/undefined optional fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      const nullData = {
        sessionId: 'test-123',
        name: 'Test User',
        email: 'test@example.com',
        company: null,
        painScore: undefined,
        estimatedValue: null,
        timeline: undefined,
        budgetRange: null,
        topOpportunity: undefined,
        googleDocUrl: null
      };

      await sendDiscordAlert(nullData);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      const embed = payload.embeds[0];

      // Should show "Not specified" for null/undefined values
      expect(embed.fields[0].value).toContain('**Company:** Not specified');
      expect(embed.fields[1].value).toContain('**Pain Score:** 0/100');
      expect(embed.fields[1].value).toContain('**Timeline:** Not specified');
      expect(embed.fields[1].value).toContain('**Budget:** Not specified');
    });
  });

  describe('Backward Compatibility Contracts', () => {
    it('should maintain compatibility with existing embed formats', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve('ok')
      });

      // Test with minimal data that older versions might send
      const minimalData = {
        sessionId: 'legacy-session-123',
        name: 'Legacy User',
        email: 'legacy@example.com'
      };

      await sendDiscordAlert(minimalData);

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      const embed = payload.embeds[0];

      // Should still have all expected fields, even if some are default values
      expect(embed.fields).toHaveLength(3); // Contact, Qualification, Value
      expect(embed.fields[0].value).toContain('Legacy User');
      expect(embed.fields[1].value).toContain('**Pain Score:** 0/100');
      expect(embed.fields[2].value).toContain('**Estimated Value:** $0');
    });

    it('should handle version changes in Discord API', async () => {
      // Mock Discord API version change response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Embed validation failed: field "oldField" not recognized')
      });

      const result = await sendDiscordAlert({
        sessionId: 'test-123',
        name: 'Test',
        email: 'test@example.com'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Discord webhook failed');
    });
  });
});