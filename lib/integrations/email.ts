import {
  sendAuditReportViaHubSpot,
  createEmailFollowUpTask,
} from "@/lib/integrations/hubspot-email";
import { generateSlackConnectURL } from "@/lib/integrations/slack-connect";

export async function sendAuditReportEmail(input: {
  to?: string | null;
  name?: string | null;
  sessionId: string;
  opportunities: any[];
  roadmap: any;
  painScore?: number | null;
  estimatedValue?: number | null;
}) {
  try {
    if (!input.to || !input.name) {
      throw new Error("Email and name are required");
    }

    // Generate Slack Connect URL
    const slackConnectUrl = generateSlackConnectURL({
      email: input.to,
      name: input.name,
      sessionId: input.sessionId,
    });

    // Try to send via HubSpot
    const hubspotResult = await sendAuditReportViaHubSpot({
      contactEmail: input.to,
      contactName: input.name,
      sessionId: input.sessionId,
      opportunities: input.opportunities,
      painScore: input.painScore || 0,
      estimatedValue: input.estimatedValue || 0,
      slackConnectUrl,
    });

    // If HubSpot email fails, create manual task as fallback
    if (!hubspotResult.success) {
      console.warn("[Email] HubSpot send failed, creating task fallback...");
      const taskResult = await createEmailFollowUpTask({
        contactEmail: input.to,
        contactName: input.name,
        sessionId: input.sessionId,
        opportunities: input.opportunities,
        painScore: input.painScore || 0,
        estimatedValue: input.estimatedValue || 0,
        slackConnectUrl,
      });
      return taskResult;
    }

    console.log("[Email] Audit report sent successfully to", input.to);
    return hubspotResult;
  } catch (e: any) {
    console.error("[Email] Failed to send audit report:", e);
    return { success: false, error: e?.message || "Email send failed" };
  }
}