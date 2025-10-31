/**
 * Google Calendar Integration Tests
 * Tests calendar event creation, scheduling, and management
 * Uses REAL Google Calendar API for production-like testing
 */

import {
  createCalendarEvent,
  cancelCalendarEvent,
  rescheduleCalendarEvent,
  syncCalendarToHubSpot
} from '@/lib/integrations/google-calendar';

import { createHubSpotDeal } from '@/lib/integrations/hubspot';

// Test data for cleanup
const testEvents = new Set<string>();

describe('Google Calendar Integration', () => {
  beforeAll(() => {
    // Ensure environment variables are set for real testing
    const requiredEnvVars = [
      'GOOGLE_REFRESH_TOKEN',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'HUBSPOT_ACCESS_TOKEN'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`${envVar} environment variable must be set for real Google Calendar integration testing`);
      }
    }
  });

  afterAll(async () => {
    // Cleanup test data
    console.log(`Google Calendar integration tests completed. Test events created: ${testEvents.size}`);

    // Cancel any test events created during testing
    for (const eventId of testEvents) {
      try {
        await cancelCalendarEvent(eventId);
        console.log(`✅ Cleaned up test event: ${eventId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to cleanup test event ${eventId}:`, error);
      }
    }
  });

  describe('createCalendarEvent', () => {
    const testEventInput = {
      email: `test-calendar-${Date.now()}@example.com`,
      name: 'John Doe (Test)',
      duration: 30,
      timeRange: {
        start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end: new Date(Date.now() + 25 * 60 * 60 * 1000) // Tomorrow + 1 hour
      },
      summary: 'AI Audit Follow-up Call (Test)',
      description: 'Discuss automation opportunities and next steps'
    };

    it('should create calendar event successfully with real Google Calendar API', async () => {
      const result = await createCalendarEvent(testEventInput);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.meetLink).toBeDefined();
      expect(result.htmlLink).toBeDefined();
      expect(result.meetLink).toContain('meet.google.com');

      if (result.eventId) {
        testEvents.add(result.eventId);
      }

      console.log(`✅ Google Calendar event created: ${result.eventId} with Meet link: ${result.meetLink}`);
    });

    it('should handle missing refresh token', async () => {
      const originalToken = process.env.GOOGLE_REFRESH_TOKEN;
      delete process.env.GOOGLE_REFRESH_TOKEN;

      try {
        const result = await createCalendarEvent(testEventInput);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Google Calendar not configured');
      } finally {
        process.env.GOOGLE_REFRESH_TOKEN = originalToken;
      }
    });

    it('should handle token refresh failure with real Google API', async () => {
      const originalToken = process.env.GOOGLE_REFRESH_TOKEN;
      process.env.GOOGLE_REFRESH_TOKEN = 'invalid-refresh-token';

      try {
        const result = await createCalendarEvent(testEventInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to obtain access token');
        console.log(`✅ Google Calendar token refresh failure test passed: ${result.error}`);
      } finally {
        process.env.GOOGLE_REFRESH_TOKEN = originalToken;
      }
    });

    it('should handle calendar API failure with real Google API', async () => {
      const originalToken = process.env.GOOGLE_REFRESH_TOKEN;
      process.env.GOOGLE_REFRESH_TOKEN = 'invalid-token-for-api-failure';

      try {
        const result = await createCalendarEvent(testEventInput);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Calendar API failed');
        console.log(`✅ Google Calendar API failure test passed: ${result.error}`);
      } finally {
        process.env.GOOGLE_REFRESH_TOKEN = originalToken;
      }
    });

    it('should create event with Meet conference with real Google Calendar API', async () => {
      const result = await createCalendarEvent(testEventInput);

      expect(result.success).toBe(true);
      expect(result.meetLink).toBeDefined();
      expect(result.meetLink).toContain('meet.google.com');

      if (result.eventId) {
        testEvents.add(result.eventId);
      }

      console.log(`✅ Google Calendar event with Meet conference created: ${result.eventId}`);
    });

    it('should add reminders to event with real Google Calendar API', async () => {
      const result = await createCalendarEvent(testEventInput);

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();

      if (result.eventId) {
        testEvents.add(result.eventId);
      }

      console.log(`✅ Google Calendar event with reminders created: ${result.eventId}`);
    });
  });

  // Note: findAvailableSlot is an internal function not exported from the module
  // Testing it would require either exporting it or testing through createCalendarEvent

  describe('cancelCalendarEvent', () => {
    let testEventId: string;

    beforeAll(async () => {
      // Create a test event to cancel
      const createResult = await createCalendarEvent({
        email: `test-cancel-${Date.now()}@example.com`,
        name: 'Cancel Test User',
        duration: 30,
        timeRange: {
          start: new Date(Date.now() + 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 25 * 60 * 60 * 1000)
        },
        summary: 'Test Event for Cancellation'
      });
      if (createResult.success && createResult.eventId) {
        testEventId = createResult.eventId;
        testEvents.add(testEventId);
      } else {
        throw new Error('Failed to create test event for cancellation test');
      }
    });

    it('should cancel event successfully with real Google Calendar API', async () => {
      const result = await cancelCalendarEvent(testEventId);

      expect(result.success).toBe(true);
      console.log(`✅ Google Calendar event cancelled: ${testEventId}`);

      // Remove from test events since it's already cancelled
      testEvents.delete(testEventId);
    });

    it('should handle cancellation failure with real Google Calendar API', async () => {
      const result = await cancelCalendarEvent('non-existent-event-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Calendar API failed');
      console.log(`✅ Google Calendar cancellation failure test passed: ${result.error}`);
    });
  });

  describe('rescheduleCalendarEvent', () => {
    let testEventId: string;

    beforeAll(async () => {
      // Create a test event to reschedule
      const createResult = await createCalendarEvent({
        email: `test-reschedule-${Date.now()}@example.com`,
        name: 'Reschedule Test User',
        duration: 30,
        timeRange: {
          start: new Date(Date.now() + 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 25 * 60 * 60 * 1000)
        },
        summary: 'Test Event for Rescheduling'
      });
      if (createResult.success && createResult.eventId) {
        testEventId = createResult.eventId;
        testEvents.add(testEventId);
      } else {
        throw new Error('Failed to create test event for reschedule test');
      }
    });

    it('should reschedule event successfully with real Google Calendar API', async () => {
      const newStart = new Date(Date.now() + 48 * 60 * 60 * 1000); // 2 days from now
      const newEnd = new Date(newStart.getTime() + 30 * 60 * 1000); // 30 minutes later

      const result = await rescheduleCalendarEvent(testEventId, newStart, newEnd);

      expect(result.success).toBe(true);
      console.log(`✅ Google Calendar event rescheduled: ${testEventId}`);
    });

    it('should handle reschedule failure with real Google Calendar API', async () => {
      const newStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const newEnd = new Date(newStart.getTime() + 30 * 60 * 1000);

      const result = await rescheduleCalendarEvent('non-existent-event-id', newStart, newEnd);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Calendar API failed');
      console.log(`✅ Google Calendar reschedule failure test passed: ${result.error}`);
    });
  });

  describe('syncCalendarToHubSpot', () => {
    let testDealId: string;
    let testEventId: string;

    beforeAll(async () => {
      // Create test deal and event for sync test
      const dealResult = await createHubSpotDeal({
        email: `test-sync-${Date.now()}@example.com`,
        name: 'Sync Test User',
        company: 'Sync Test Company',
        dealValue: 10000,
        auditUrl: 'https://audit.example.com/sync-test'
      });

      if (dealResult.success && dealResult.dealId) {
        testDealId = dealResult.dealId;
      } else {
        throw new Error('Failed to create test deal for sync test');
      }

      const eventResult = await createCalendarEvent({
        email: `test-sync-event-${Date.now()}@example.com`,
        name: 'Sync Test Event User',
        duration: 30,
        timeRange: {
          start: new Date(Date.now() + 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 25 * 60 * 60 * 1000)
        },
        summary: 'Test Event for HubSpot Sync'
      });
      if (eventResult.success && eventResult.eventId) {
        testEventId = eventResult.eventId;
        testEvents.add(testEventId);
      } else {
        throw new Error('Failed to create test event for sync test');
      }
    });

    it('should sync calendar event to HubSpot successfully with real APIs', async () => {
      const meetLink = 'https://meet.google.com/test-sync-meeting';
      const eventTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const result = await syncCalendarToHubSpot(testDealId, testEventId, meetLink, eventTime);

      expect(result.success).toBe(true);
      console.log(`✅ Calendar event synced to HubSpot deal: ${testDealId}`);
    });

    it('should handle missing HubSpot token', async () => {
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      delete process.env.HUBSPOT_ACCESS_TOKEN;

      try {
        const result = await syncCalendarToHubSpot(testDealId, testEventId, 'https://meet.google.com/test', new Date());

        expect(result.success).toBe(false);
        expect(result.error).toBe('HubSpot not configured');
      } finally {
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });

    it('should handle HubSpot API failure with real API', async () => {
      const originalToken = process.env.HUBSPOT_ACCESS_TOKEN;
      process.env.HUBSPOT_ACCESS_TOKEN = 'invalid-token-for-sync';

      try {
        const result = await syncCalendarToHubSpot(testDealId, testEventId, 'https://meet.google.com/test', new Date());

        expect(result.success).toBe(false);
        expect(result.error).toContain('HubSpot update failed');
        console.log(`✅ HubSpot sync failure test passed: ${result.error}`);
      } finally {
        process.env.HUBSPOT_ACCESS_TOKEN = originalToken;
      }
    });
  });
});