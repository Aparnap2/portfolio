/**
 * Google Calendar Integration Tests
 * TDD tests for calendar event creation and management
 */

import {
  createCalendarEvent,
  syncCalendarToHubSpot,
  cancelCalendarEvent,
  rescheduleCalendarEvent,
} from "@/lib/integrations/google-calendar";

// Mock fetch globally
global.fetch = jest.fn();

describe("Google Calendar Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_REFRESH_TOKEN = "test-refresh-token";
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  });

  afterEach(() => {
    delete process.env.GOOGLE_REFRESH_TOKEN;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  describe("createCalendarEvent", () => {
    it("should create event with Meet link successfully", async () => {
      // Mock token refresh
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        // Mock freeBusy check
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            calendars: { primary: { busy: [] } },
          }),
        })
        // Mock event creation
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "event-123",
            htmlLink: "https://calendar.google.com/event?eid=event-123",
            conferenceData: {
              entryPoints: [{ uri: "https://meet.google.com/abc-defg-hij" }],
            },
          }),
        });

      const result = await createCalendarEvent({
        email: "client@example.com",
        name: "John Doe",
        duration: 20,
        timeRange: {
          start: new Date("2025-11-01T10:00:00Z"),
          end: new Date("2025-11-03T18:00:00Z"),
        },
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("event-123");
      expect(result.meetLink).toBe("https://meet.google.com/abc-defg-hij");
      expect(result.htmlLink).toBeDefined();
    });

    it("should handle missing refresh token", async () => {
      delete process.env.GOOGLE_REFRESH_TOKEN;

      const result = await createCalendarEvent({
        email: "client@example.com",
        name: "John Doe",
        duration: 20,
        timeRange: {
          start: new Date("2025-11-01T10:00:00Z"),
          end: new Date("2025-11-03T18:00:00Z"),
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Google Calendar not configured");
    });

    it("should handle API failures gracefully", async () => {
      // Mock token refresh success
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        // Mock freeBusy check success
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            calendars: { primary: { busy: [] } },
          }),
        })
        // Mock event creation failure
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Bad Request",
          text: async () => "Invalid event data",
        });

      const result = await createCalendarEvent({
        email: "client@example.com",
        name: "John Doe",
        duration: 20,
        timeRange: {
          start: new Date("2025-11-01T10:00:00Z"),
          end: new Date("2025-11-03T18:00:00Z"),
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Calendar API failed");
    });

    it("should include custom summary and description", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            calendars: { primary: { busy: [] } },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "event-123",
            conferenceData: {
              entryPoints: [{ uri: "https://meet.google.com/abc-defg-hij" }],
            },
          }),
        });

      await createCalendarEvent({
        email: "client@example.com",
        name: "John Doe",
        duration: 20,
        timeRange: {
          start: new Date("2025-11-01T10:00:00Z"),
          end: new Date("2025-11-03T18:00:00Z"),
        },
        summary: "Custom Meeting Title",
        description: "Custom meeting description",
      });

      const createEventCall = (global.fetch as jest.Mock).mock.calls[2];
      const eventData = JSON.parse(createEventCall[1].body);

      expect(eventData.summary).toBe("Custom Meeting Title");
      expect(eventData.description).toBe("Custom meeting description");
    });

    it("should handle busy time slots", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            calendars: {
              primary: {
                busy: [
                  {
                    start: "2025-11-01T10:00:00Z",
                    end: "2025-11-01T11:00:00Z",
                  },
                ],
              },
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "event-123",
            conferenceData: {
              entryPoints: [{ uri: "https://meet.google.com/abc-defg-hij" }],
            },
          }),
        });

      const result = await createCalendarEvent({
        email: "client@example.com",
        name: "John Doe",
        duration: 20,
        timeRange: {
          start: new Date("2025-11-01T09:00:00Z"),
          end: new Date("2025-11-01T18:00:00Z"),
        },
      });

      expect(result.success).toBe(true);
      // Should find a slot outside the busy time
    });
  });

  describe("syncCalendarToHubSpot", () => {
    beforeEach(() => {
      process.env.HUBSPOT_ACCESS_TOKEN = "test-hubspot-token";
    });

    afterEach(() => {
      delete process.env.HUBSPOT_ACCESS_TOKEN;
    });

    it("should update HubSpot deal with meeting details", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "deal-123" }),
      });

      const result = await syncCalendarToHubSpot(
        "deal-123",
        "event-456",
        "https://meet.google.com/abc-defg-hij",
        new Date("2025-11-01T10:00:00Z")
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("deals/deal-123"),
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Authorization: "Bearer test-hubspot-token",
          }),
        })
      );
    });

    it("should handle missing HubSpot token", async () => {
      delete process.env.HUBSPOT_ACCESS_TOKEN;

      const result = await syncCalendarToHubSpot(
        "deal-123",
        "event-456",
        "https://meet.google.com/abc-defg-hij",
        new Date("2025-11-01T10:00:00Z")
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("HubSpot not configured");
    });

    it("should handle HubSpot API failures", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      const result = await syncCalendarToHubSpot(
        "deal-123",
        "event-456",
        "https://meet.google.com/abc-defg-hij",
        new Date("2025-11-01T10:00:00Z")
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("HubSpot update failed");
    });
  });

  describe("cancelCalendarEvent", () => {
    it("should cancel event successfully", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const result = await cancelCalendarEvent("event-123");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("events/event-123"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });

    it("should handle cancellation failures", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Not Found",
        });

      const result = await cancelCalendarEvent("event-123");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Calendar API failed");
    });
  });

  describe("rescheduleCalendarEvent", () => {
    it("should reschedule event successfully", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "event-123" }),
        });

      const newStart = new Date("2025-11-02T10:00:00Z");
      const newEnd = new Date("2025-11-02T10:20:00Z");

      const result = await rescheduleCalendarEvent("event-123", newStart, newEnd);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("events/event-123"),
        expect.objectContaining({
          method: "PATCH",
        })
      );
    });

    it("should handle rescheduling failures", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Bad Request",
        });

      const newStart = new Date("2025-11-02T10:00:00Z");
      const newEnd = new Date("2025-11-02T10:20:00Z");

      const result = await rescheduleCalendarEvent("event-123", newStart, newEnd);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Calendar API failed");
    });
  });
});
