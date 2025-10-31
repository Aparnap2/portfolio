/**
 * Google Calendar Integration
 * Create events with Google Meet links for audit follow-ups
 */

import * as Sentry from "@sentry/nextjs";

interface CalendarEventInput {
  email: string;
  name: string;
  duration: number; // minutes
  timeRange: {
    start: Date;
    end: Date;
  };
  summary?: string;
  description?: string;
}

interface CalendarEventResult {
  success: boolean;
  eventId?: string;
  meetLink?: string;
  htmlLink?: string;
  error?: string;
}

/**
 * Create a Google Calendar event with Meet link
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<CalendarEventResult> {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    console.warn("[Google Calendar] Refresh token not configured");
    return { success: false, error: "Google Calendar not configured" };
  }

  try {
    // Get access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Failed to obtain access token");
    }

    // Find available time slot
    const eventTime = await findAvailableSlot(
      input.timeRange.start,
      input.timeRange.end,
      input.duration,
      accessToken
    );

    if (!eventTime) {
      throw new Error("No available time slots found in the specified range");
    }

    // Create event with Meet link
    const event = {
      summary: input.summary || `AI Audit Follow-up - ${input.name}`,
      description: input.description || `
AI Opportunity Assessment Follow-up Meeting

Attendee: ${input.name} (${input.email})

This meeting will cover:
- Review of audit findings
- Discussion of top opportunities
- Implementation roadmap
- Q&A session

Duration: ${input.duration} minutes
      `.trim(),
      start: {
        dateTime: eventTime.start.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: eventTime.end.toISOString(),
        timeZone: "UTC",
      },
      attendees: [
        { email: input.email, displayName: input.name },
      ],
      conferenceData: {
        createRequest: {
          requestId: `audit-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Create the event
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Calendar API failed: ${response.statusText} - ${errorText}`);
    }

    const createdEvent = await response.json();

    console.log("[Google Calendar] Event created successfully:", createdEvent.id);

    return {
      success: true,
      eventId: createdEvent.id,
      meetLink: createdEvent.conferenceData?.entryPoints?.[0]?.uri || createdEvent.hangoutLink,
      htmlLink: createdEvent.htmlLink,
    };
  } catch (error) {
    console.error("[Google Calendar] Event creation failed:", error);
    Sentry.captureException(error, {
      tags: { integration: "google_calendar", operation: "create_event" },
      extra: { input },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Find available time slot within the specified range
 */
async function findAvailableSlot(
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
  accessToken: string
): Promise<{ start: Date; end: Date } | null> {
  try {
    // Query for free/busy information
    const freeBusyResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: rangeStart.toISOString(),
          timeMax: rangeEnd.toISOString(),
          items: [{ id: "primary" }],
        }),
      }
    );

    if (!freeBusyResponse.ok) {
      throw new Error(`FreeBusy API failed: ${freeBusyResponse.statusText}`);
    }

    const freeBusyData = await freeBusyResponse.json();
    const busySlots = freeBusyData.calendars?.primary?.busy || [];

    // Find first available slot
    const slots = generateTimeSlots(rangeStart, rangeEnd, durationMinutes);
    
    for (const slot of slots) {
      const isAvailable = !busySlots.some((busy: any) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return (
          (slot.start >= busyStart && slot.start < busyEnd) ||
          (slot.end > busyStart && slot.end <= busyEnd) ||
          (slot.start <= busyStart && slot.end >= busyEnd)
        );
      });

      if (isAvailable) {
        return slot;
      }
    }

    return null;
  } catch (error) {
    console.error("[Google Calendar] Error finding available slot:", error);
    // Fallback: return first slot in range
    const start = new Date(rangeStart);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    return { start, end };
  }
}

/**
 * Generate possible time slots within business hours
 */
function generateTimeSlots(
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number
): Array<{ start: Date; end: Date }> {
  const slots: Array<{ start: Date; end: Date }> = [];
  const businessHoursStart = 9; // 9 AM
  const businessHoursEnd = 17; // 5 PM

  let current = new Date(rangeStart);

  while (current < rangeEnd) {
    const hour = current.getUTCHours();
    
    // Only consider business hours
    if (hour >= businessHoursStart && hour < businessHoursEnd) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000);
      
      if (slotEnd <= rangeEnd) {
        slots.push({
          start: new Date(current),
          end: slotEnd,
        });
      }
    }

    // Move to next hour
    current = new Date(current.getTime() + 60 * 60 * 1000);
  }

  return slots;
}

/**
 * Get Google OAuth access token
 */
async function getAccessToken(): Promise<string | null> {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    throw new Error("GOOGLE_REFRESH_TOKEN not found in environment");
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokens = await response.json();
    return tokens.access_token;
  } catch (error) {
    console.error("[Google Auth] Refresh token failed:", error);
    throw error;
  }
}

/**
 * Update HubSpot deal with calendar event details
 */
export async function syncCalendarToHubSpot(
  dealId: string,
  eventId: string,
  meetLink: string,
  eventTime: Date
): Promise<{ success: boolean; error?: string }> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    return { success: false, error: "HubSpot not configured" };
  }

  try {
    // Update deal with meeting information
    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/deals/${dealId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            hs_meeting_link: meetLink,
            hs_meeting_scheduled_date: eventTime.toISOString(),
            dealstage: "appointmentscheduled",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HubSpot update failed: ${response.statusText}`);
    }

    console.log("[HubSpot] Deal updated with calendar event");
    return { success: true };
  } catch (error) {
    console.error("[HubSpot] Calendar sync failed:", error);
    Sentry.captureException(error, {
      tags: { integration: "hubspot", operation: "calendar_sync" },
      extra: { dealId, eventId },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cancel a calendar event
 */
export async function cancelCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Failed to obtain access token");
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API failed: ${response.statusText}`);
    }

    console.log("[Google Calendar] Event cancelled:", eventId);
    return { success: true };
  } catch (error) {
    console.error("[Google Calendar] Event cancellation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Reschedule a calendar event
 */
export async function rescheduleCalendarEvent(
  eventId: string,
  newStart: Date,
  newEnd: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error("Failed to obtain access token");
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: {
            dateTime: newStart.toISOString(),
            timeZone: "UTC",
          },
          end: {
            dateTime: newEnd.toISOString(),
            timeZone: "UTC",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Calendar API failed: ${response.statusText}`);
    }

    console.log("[Google Calendar] Event rescheduled:", eventId);
    return { success: true };
  } catch (error) {
    console.error("[Google Calendar] Event rescheduling failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
