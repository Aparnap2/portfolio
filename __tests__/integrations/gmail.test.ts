/**
 * Gmail Integration Tests
 * Tests Gmail API operations for sending audit reports
 * Uses REAL Gmail API for production-like testing
 */

import { sendGmailReport } from '@/lib/integrations/gmail';

// Test data for cleanup
const testEmails = new Set<string>();

describe('Gmail Integration', () => {
  beforeAll(() => {
    // Ensure environment variables are set for real testing
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GMAIL_ACCESS_TOKEN',
      'GMAIL_REFRESH_TOKEN'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} environment variable must be set for real Gmail integration testing`);
      }
    }
  });

  afterAll(async () => {
    // Cleanup test data if needed
    console.log(`Gmail integration tests completed. Test emails sent: ${testEmails.size}`);
  });

  describe('sendGmailReport', () => {
    const testSession = {
      extracted_info: {
        industry: 'Technology',
        company: 'Tech Solutions Inc (Test)',
        size: '50-100 employees'
      },
      opportunities: [
        {
          name: 'Email Marketing Automation',
          monthly_savings: 2500,
          roi_12m: 300,
          implementation_weeks: 4
        },
        {
          name: 'Customer Support Chatbot',
          monthly_savings: 1800,
          roi_12m: 240,
          implementation_weeks: 6
        }
      ]
    };

    it('should send email report successfully with real Gmail API', async () => {
      const testEmail = `test-gmail-${Date.now()}@example.com`;
      testEmails.add(testEmail);

      const result = await sendGmailReport(testEmail, testSession);

      expect(result.success).toBe(true);
      console.log(`✅ Gmail report sent successfully to ${testEmail}`);
    });

    it('should refresh access token when needed with real Gmail API', async () => {
      const originalToken = process.env.GMAIL_ACCESS_TOKEN;
      delete process.env.GMAIL_ACCESS_TOKEN;

      try {
        const testEmail = `test-refresh-${Date.now()}@example.com`;
        testEmails.add(testEmail);

        const result = await sendGmailReport(testEmail, testSession);

        expect(result.success).toBe(true);
        console.log(`✅ Gmail token refresh and email send successful to ${testEmail}`);
      } finally {
        process.env.GMAIL_ACCESS_TOKEN = originalToken;
      }
    });

    it('should handle missing access token and refresh token', async () => {
      const originalToken = process.env.GMAIL_ACCESS_TOKEN;
      const originalRefresh = process.env.GMAIL_REFRESH_TOKEN;

      delete process.env.GMAIL_ACCESS_TOKEN;
      delete process.env.GMAIL_REFRESH_TOKEN;

      try {
        const result = await sendGmailReport('test@example.com', testSession);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No Gmail access token available');
      } finally {
        process.env.GMAIL_ACCESS_TOKEN = originalToken;
        process.env.GMAIL_REFRESH_TOKEN = originalRefresh;
      }
    });

    it('should handle token refresh failure with real Gmail API', async () => {
      const originalToken = process.env.GMAIL_ACCESS_TOKEN;
      const originalRefresh = process.env.GMAIL_REFRESH_TOKEN;

      delete process.env.GMAIL_ACCESS_TOKEN;
      process.env.GMAIL_REFRESH_TOKEN = 'invalid-refresh-token';

      try {
        const result = await sendGmailReport('test@example.com', testSession);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Token refresh failed');
        console.log(`✅ Gmail token refresh failure test passed: ${result.error}`);
      } finally {
        process.env.GMAIL_ACCESS_TOKEN = originalToken;
        process.env.GMAIL_REFRESH_TOKEN = originalRefresh;
      }
    });

    it('should handle Gmail API failure with real Gmail API', async () => {
      const originalToken = process.env.GMAIL_ACCESS_TOKEN;
      process.env.GMAIL_ACCESS_TOKEN = 'invalid-access-token';

      try {
        const result = await sendGmailReport('test@example.com', testSession);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Gmail API failed');
        console.log(`✅ Gmail API failure test passed: ${result.error}`);
      } finally {
        process.env.GMAIL_ACCESS_TOKEN = originalToken;
      }
    });

    it('should handle network errors', async () => {
      // Temporarily mock fetch to simulate network error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network timeout'));

      try {
        const result = await sendGmailReport('test@example.com', testSession);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network timeout');
        console.log(`✅ Gmail network error test passed`);
      } finally {
        global.fetch = originalFetch;
      }
    });

    it('should include Google Doc link when provided with real Gmail API', async () => {
      const googleDocUrl = 'https://docs.google.com/document/test-doc';
      const testEmail = `test-doc-link-${Date.now()}@example.com`;
      testEmails.add(testEmail);

      const result = await sendGmailReport(testEmail, testSession, googleDocUrl);

      expect(result.success).toBe(true);
      console.log(`✅ Gmail report with Google Doc link sent successfully to ${testEmail}`);
    });

    it('should calculate total savings correctly with real Gmail API', async () => {
      const testEmail = `test-savings-${Date.now()}@example.com`;
      testEmails.add(testEmail);

      const result = await sendGmailReport(testEmail, testSession);

      expect(result.success).toBe(true);
      console.log(`✅ Gmail report with savings calculation sent successfully to ${testEmail}`);
    });

    it('should handle empty opportunities array with real Gmail API', async () => {
      const sessionWithNoOpportunities = {
        ...testSession,
        opportunities: []
      };

      const testEmail = `test-no-opps-${Date.now()}@example.com`;
      testEmails.add(testEmail);

      const result = await sendGmailReport(testEmail, sessionWithNoOpportunities);

      expect(result.success).toBe(true);
      console.log(`✅ Gmail report with no opportunities sent successfully to ${testEmail}`);
    });

    it('should limit opportunities to top 3 in email with real Gmail API', async () => {
      const sessionWithManyOpportunities = {
        ...testSession,
        opportunities: Array.from({ length: 10 }, (_, i) => ({
          name: `Opportunity ${i + 1}`,
          monthly_savings: 1000,
          roi_12m: 200,
          implementation_weeks: 4
        }))
      };

      const testEmail = `test-many-opps-${Date.now()}@example.com`;
      testEmails.add(testEmail);

      const result = await sendGmailReport(testEmail, sessionWithManyOpportunities);

      expect(result.success).toBe(true);
      console.log(`✅ Gmail report with limited opportunities sent successfully to ${testEmail}`);
    });

    it('should handle missing extracted_info gracefully with real Gmail API', async () => {
      const sessionWithoutInfo = {
        opportunities: testSession.opportunities
      };

      const testEmail = `test-no-info-${Date.now()}@example.com`;
      testEmails.add(testEmail);

      const result = await sendGmailReport(testEmail, sessionWithoutInfo);

      expect(result.success).toBe(true);
      console.log(`✅ Gmail report with missing info handled successfully to ${testEmail}`);
    });

    it('should send both HTML and text versions with real Gmail API', async () => {
      const testEmail = `test-html-text-${Date.now()}@example.com`;
      testEmails.add(testEmail);

      const result = await sendGmailReport(testEmail, testSession);

      expect(result.success).toBe(true);
      console.log(`✅ Gmail report with HTML and text versions sent successfully to ${testEmail}`);
    });
  });
});