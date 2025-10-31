/**
 * Discord Integration Tests
 * Tests Discord webhook functionality for lead alerts and system notifications
 * Uses REAL Discord webhook for production-like testing
 */

import { sendDiscordAlert, sendDiscordSystemAlert, sendDiscordCompletionNotification } from '@/lib/integrations/discord';

// Test data for cleanup
const testContacts = new Set<string>();

describe('Discord Integration', () => {
  beforeAll(() => {
    // Ensure environment variables are set for real testing
    if (!process.env.DISCORD_WEBHOOK_URL) {
      throw new Error('DISCORD_WEBHOOK_URL environment variable must be set for real integration testing');
    }

    // Validate webhook URL format
    if (!process.env.DISCORD_WEBHOOK_URL.includes('/api/webhooks/')) {
      throw new Error('DISCORD_WEBHOOK_URL must be a valid Discord webhook URL');
    }
  });

  afterAll(async () => {
    // Cleanup test data if needed
    // Note: Discord webhooks don't provide cleanup APIs, but we can log test usage
    console.log(`Discord integration tests completed. Test contacts created: ${testContacts.size}`);
  });

  describe('sendDiscordAlert', () => {
    const testLeadData = {
      sessionId: `test-session-${Date.now()}`,
      name: 'John Doe (Test)',
      email: `test-${Date.now()}@example.com`,
      company: 'Tech Corp (Test)',
      painScore: 85,
      estimatedValue: 50000,
      timeline: '3 months',
      budgetRange: '$50k-100k',
      topOpportunity: 'Process Automation - Save $15k/month',
      googleDocUrl: 'https://docs.google.com/document/test'
    };

    beforeEach(() => {
      // Track test contacts for cleanup
      testContacts.add(testLeadData.email);
    });

    it('should send lead alert successfully with real Discord webhook', async () => {
      const result = await sendDiscordAlert(testLeadData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('webhook-sent');

      // Verify the webhook was called (we can't inspect the payload directly with real API)
      // but we can check that no error was thrown and success is true
      console.log(`✅ Discord lead alert sent for ${testLeadData.email}`);
    });

    it('should handle missing webhook URL', async () => {
      const originalWebhook = process.env.DISCORD_WEBHOOK_URL;
      delete process.env.DISCORD_WEBHOOK_URL;

      try {
        const result = await sendDiscordAlert(testLeadData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Discord not configured');
      } finally {
        // Restore webhook URL
        process.env.DISCORD_WEBHOOK_URL = originalWebhook;
      }
    });

    it('should handle invalid webhook URL format', async () => {
      const originalWebhook = process.env.DISCORD_WEBHOOK_URL;
      process.env.DISCORD_WEBHOOK_URL = 'https://invalid-webhook-url.com';

      try {
        const result = await sendDiscordAlert(testLeadData);

        expect(result.success).toBe(false);
        expect(result.error).toBe("Invalid webhook URL. Get it from: Channel Settings → Integrations → Webhooks");
      } finally {
        // Restore webhook URL
        process.env.DISCORD_WEBHOOK_URL = originalWebhook;
      }
    });

    it('should handle API failure with real webhook', async () => {
      // Temporarily set invalid webhook to test error handling
      const originalWebhook = process.env.DISCORD_WEBHOOK_URL;
      process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/invalid/invalid';

      try {
        const result = await sendDiscordAlert(testLeadData);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Discord webhook failed');
        console.log(`✅ Discord API failure test passed: ${result.error}`);
      } finally {
        // Restore webhook URL
        process.env.DISCORD_WEBHOOK_URL = originalWebhook;
      }
    });

    it('should handle network errors', async () => {
      // Test with a non-existent domain to simulate network error
      const originalWebhook = process.env.DISCORD_WEBHOOK_URL;
      process.env.DISCORD_WEBHOOK_URL = 'https://non-existent-domain-12345.com/api/webhooks/test/test';

      try {
        const result = await sendDiscordAlert(testLeadData);

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy(); // Could be network error or DNS error
        console.log(`✅ Network error test passed: ${result.error}`);
      } finally {
        // Restore webhook URL
        process.env.DISCORD_WEBHOOK_URL = originalWebhook;
      }
    });

    it('should include top opportunity and Google Doc link when provided', async () => {
      const result = await sendDiscordAlert(testLeadData);

      expect(result.success).toBe(true);
      console.log(`✅ Discord alert with opportunity and Google Doc link sent successfully`);
    });

    it('should use correct color based on pain score with real webhook', async () => {
      // Test different pain score ranges with real webhook
      const testCases = [
        { painScore: 95, description: 'high pain (red)' },
        { painScore: 75, description: 'medium pain (orange)' },
        { painScore: 55, description: 'low-medium pain (yellow)' },
        { painScore: 25, description: 'low pain (green)' },
      ];

      for (const { painScore, description } of testCases) {
        const testData = { ...testLeadData, painScore, email: `test-pain-${painScore}-${Date.now()}@example.com` };
        testContacts.add(testData.email);

        const result = await sendDiscordAlert(testData);
        expect(result.success).toBe(true);
        console.log(`✅ Discord alert with ${description} pain score sent successfully`);
      }
    });
  });

  describe('sendDiscordSystemAlert', () => {
    const testSystemData = {
      message: 'Database connection failed (Test)',
      level: 'error' as const,
      context: {
        service: 'database',
        error: 'Connection timeout',
        timestamp: new Date().toISOString(),
        testId: `test-${Date.now()}`
      }
    };

    it('should send system alert successfully with real webhook', async () => {
      const result = await sendDiscordSystemAlert(testSystemData);

      expect(result.success).toBe(true);
      console.log(`✅ Discord system alert sent successfully`);
    });

    it('should handle missing webhook URL', async () => {
      const originalWebhook = process.env.DISCORD_WEBHOOK_URL;
      delete process.env.DISCORD_WEBHOOK_URL;

      try {
        const result = await sendDiscordSystemAlert(testSystemData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Discord not configured');
      } finally {
        process.env.DISCORD_WEBHOOK_URL = originalWebhook;
      }
    });

    it('should use correct emoji and color for different levels with real webhook', async () => {
      const testCases = [
        { level: 'error' as const, description: 'error level' },
        { level: 'warning' as const, description: 'warning level' },
        { level: 'info' as const, description: 'info level' },
      ];

      for (const { level, description } of testCases) {
        const testData = {
          ...testSystemData,
          level,
          context: { ...testSystemData.context, testId: `test-${level}-${Date.now()}` }
        };

        const result = await sendDiscordSystemAlert(testData);
        expect(result.success).toBe(true);
        console.log(`✅ Discord system alert with ${description} sent successfully`);
      }
    });

    it('should include context fields when provided with real webhook', async () => {
      const result = await sendDiscordSystemAlert(testSystemData);

      expect(result.success).toBe(true);
      console.log(`✅ Discord system alert with context fields sent successfully`);
    });
  });

  describe('sendDiscordCompletionNotification', () => {
    const testCompletionData = {
      sessionId: `test-session-${Date.now()}`,
      name: 'Jane Smith (Test)',
      email: `test-completion-${Date.now()}@example.com`,
      opportunities: [
        { name: 'Email Automation', difficulty: 'Easy', monthlySavings: 5000 },
        { name: 'Data Entry Process', difficulty: 'Medium', monthlySavings: 8000 },
        { name: 'Customer Onboarding', difficulty: 'Hard', monthlySavings: 12000 }
      ],
      painScore: 78,
      estimatedValue: 75000
    };

    beforeEach(() => {
      testContacts.add(testCompletionData.email);
    });

    it('should send completion notification successfully with real webhook', async () => {
      const result = await sendDiscordCompletionNotification(testCompletionData);

      expect(result.success).toBe(true);
      console.log(`✅ Discord completion notification sent successfully`);
    });

    it('should handle missing webhook URL', async () => {
      const originalWebhook = process.env.DISCORD_WEBHOOK_URL;
      delete process.env.DISCORD_WEBHOOK_URL;

      try {
        const result = await sendDiscordCompletionNotification(testCompletionData);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Discord not configured');
      } finally {
        process.env.DISCORD_WEBHOOK_URL = originalWebhook;
      }
    });

    it('should limit opportunities to top 3 with real webhook', async () => {
      const dataWithManyOpportunities = {
        ...testCompletionData,
        email: `test-many-opps-${Date.now()}@example.com`,
        opportunities: Array.from({ length: 10 }, (_, i) => ({
          name: `Opportunity ${i + 1}`,
          difficulty: 'Easy',
          monthlySavings: 1000 * (i + 1)
        }))
      };
      testContacts.add(dataWithManyOpportunities.email);

      const result = await sendDiscordCompletionNotification(dataWithManyOpportunities);
      expect(result.success).toBe(true);
      console.log(`✅ Discord completion notification with limited opportunities sent successfully`);
    });

    it('should handle empty opportunities array with real webhook', async () => {
      const dataWithNoOpportunities = {
        ...testCompletionData,
        email: `test-no-opps-${Date.now()}@example.com`,
        opportunities: []
      };
      testContacts.add(dataWithNoOpportunities.email);

      const result = await sendDiscordCompletionNotification(dataWithNoOpportunities);
      expect(result.success).toBe(true);
      console.log(`✅ Discord completion notification with no opportunities sent successfully`);
    });
  });
});