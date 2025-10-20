import * as Sentry from "@sentry/nextjs";

/**
 * Generate Slack Connect invite URL
 * This allows leads to connect with you directly on Slack
 */
export function generateSlackConnectURL({
  email,
  name,
  sessionId,
}: {
  email: string;
  name: string;
  sessionId: string;
}): string {
  const baseUrl = "https://join.slack.com/t";
  const workspaceId = process.env.SLACK_WORKSPACE_ID; // e.g., "aparna-portfolio"

  if (!workspaceId) {
    console.warn("[Slack] Workspace ID not configured");
    // Fallback to regular Slack sharing link
    return `https://slack.com/app_redirect?channel=${process.env.SLACK_CHANNEL_ID || "general"}`;
  }

  // Encode metadata in URL params (Slack will pre-fill invitation)
  const params = new URLSearchParams({
    email,
    name,
    metadata: JSON.stringify({
      sessionId,
      source: "audit_completion",
    })
  });

  return `${baseUrl}/${workspaceId}?${params.toString()}`;
}

/**
 * Alternative: Create Slack Connect channel programmatically
 * Requires Slack app with conversations.connect scope
 */
export async function createSlackConnectChannel({
  email,
  name,
  sessionId,
}: {
  email: string;
  name: string;
  sessionId: string;
}) {
  try {
    const slackToken = process.env.SLACK_BOT_TOKEN;
    
    if (!slackToken) {
      return {
        success: false,
        error: "Slack token not configured",
        fallbackUrl: `mailto:${process.env.CONTACT_EMAIL || "aparna@example.com"}?subject=AI Audit Follow-up&body=Session: ${sessionId}`,
      };
    }
    
    // This requires Slack Connect (paid feature)
    // For free tier, use the invite URL method above
    
    console.log(`[Slack] Would create Slack Connect channel for ${email}`);
    
    return {
      success: true,
      channelId: null,
      inviteUrl: generateSlackConnectURL({ email, name, sessionId }),
      message: "Using Slack invite URL (Connect requires paid tier)",
    };
    
  } catch (error) {
    console.error("[Slack] Connect channel creation failed:", error);
    Sentry.captureException(error);
    
    return {
      success: false,
      error: error.message,
      fallbackUrl: generateSlackConnectURL({ email, name, sessionId }),
    };
  }
}