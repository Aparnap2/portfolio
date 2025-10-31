import * as Sentry from "@sentry/nextjs";

interface DiscordLeadAlert {
  sessionId: string;
  name: string;
  email: string;
  company?: string;
  painScore?: number;
  estimatedValue?: number;
  timeline?: string;
  budgetRange?: string;
  topOpportunity?: string;
  googleDocUrl?: string;
}

interface DiscordSystemAlert {
  message: string;
  level: "info" | "warning" | "error";
  context?: Record<string, any>;
}

/**
 * Send lead alert to Discord
 */
export async function sendDiscordAlert(data: DiscordLeadAlert) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.warn("[Discord] Webhook URL not configured, skipping notification");
    return { success: false, error: "Discord not configured" };
  }

  // Check if webhook URL is valid
  if (!process.env.DISCORD_WEBHOOK_URL.includes('/api/webhooks/')) {
    console.warn("[Discord] Invalid webhook URL format - must be webhook URL, not OAuth URL");
    return { success: false, error: "Invalid webhook URL. Get it from: Channel Settings → Integrations → Webhooks" };
  }

  const requiredFields: Array<keyof DiscordLeadAlert> = ["sessionId", "name", "email"];
  const missingFields = requiredFields.filter((field) => !data[field as keyof DiscordLeadAlert]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  try {
    const embed = {
      title: "🎯 New AI Audit Lead",
      color: getPainScoreColor(data.painScore || 0),
      fields: [
        {
          name: "👤 Contact",
          value: `**Name:** ${data.name}\n**Email:** ${data.email}\n**Company:** ${data.company || "Not specified"}`,
          inline: true,
        },
        {
          name: "📊 Qualification",
          value: `**Pain Score:** ${data.painScore || 0}/100\n**Timeline:** ${data.timeline || "Not specified"}\n**Budget:** ${data.budgetRange || "Not specified"}`,
          inline: true,
        },
        {
          name: "💰 Value",
          value: `**Estimated Value:** $${formatCurrency(data.estimatedValue)}`,
          inline: true,
        },
      ],
      footer: {
        text: `Session ID: ${data.sessionId}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Add top opportunity if available
    if (data.topOpportunity) {
      embed.fields?.push({
        name: "🚀 Top Opportunity",
        value: data.topOpportunity,
        inline: false,
      });
    }

    // Add Google Doc link if available
    if (data.googleDocUrl) {
      embed.fields?.push({
        name: "📄 Full Report",
        value: `[View Google Doc](${data.googleDocUrl})`,
        inline: false,
      });
    }

    const payload = {
      embeds: [embed],
      username: "AI Audit Bot",
      avatar_url: "https://your-domain.com/bot-avatar.png", // Optional
    };

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.statusText} - ${errorText}`);
    }

    console.log("[Discord] Lead alert sent successfully");

    return {
      success: true,
      messageId: 'webhook-sent',
    };
  } catch (error) {
    console.error("[Discord] Failed to send lead alert:", error);
    Sentry.captureException(error, {
      tags: { integration: "discord", operation: "send_lead_alert" },
      extra: { data },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send system alert to Discord
 */
export async function sendDiscordSystemAlert(data: DiscordSystemAlert) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    console.warn("[Discord] Webhook URL not configured, skipping system alert");
    return { success: false, error: "Discord not configured" };
  }

  try {
    const color = getLevelColor(data.level);
    const emoji = getLevelEmoji(data.level);

    const embed = {
      title: `${emoji} System Alert`,
      color: color,
      description: data.message,
      fields: data.context 
        ? Object.entries(data.context).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true,
          }))
        : [],
      timestamp: new Date().toISOString(),
    };

    const payload = {
      embeds: [embed],
      username: "AI Audit System",
      avatar_url: "https://your-domain.com/system-avatar.png", // Optional
    };

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.statusText} - ${errorText}`);
    }

    console.log("[Discord] System alert sent successfully");

    return {
      success: true,
      messageId: 'webhook-sent',
    };
  } catch (error) {
    console.error("[Discord] Failed to send system alert:", error);
    Sentry.captureException(error, {
      tags: { integration: "discord", operation: "send_system_alert" },
      extra: { data },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send audit completion notification to Discord
 */
export async function sendDiscordCompletionNotification(data: {
  sessionId: string;
  name: string;
  email: string;
  opportunities: any[];
  painScore: number;
  estimatedValue: number;
}) {
  if (!process.env.DISCORD_WEBHOOK_URL) {
    return { success: false, error: "Discord not configured" };
  }

  try {
    const opportunityList = data.opportunities
      .slice(0, 3)
      .map((opp, index) => `${index + 1}. **${opp.name}** (${opp.difficulty}) - $${formatCurrency(opp.monthlySavings)}/mo`)
      .join("\n");

    const embed = {
      title: "✅ AI Audit Completed",
      color: 0x00ff00, // Green
      fields: [
        {
          name: "👤 Client",
          value: `**Name:** ${data.name}\n**Email:** ${data.email}`,
          inline: true,
        },
        {
          name: "📊 Results",
          value: `**Pain Score:** ${data.painScore}/100\n**Opportunities:** ${data.opportunities.length}\n**Monthly Savings:** $${formatCurrency(data.opportunities.reduce((sum, opp) => sum + (opp.monthlySavings || 0), 0))}`,
          inline: true,
        },
        {
          name: "🚀 Top Opportunities",
          value: opportunityList || "No opportunities identified",
          inline: false,
        },
      ],
      footer: {
        text: `Session ID: ${data.sessionId}`,
      },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      embeds: [embed],
      username: "AI Audit Bot",
    };

    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord webhook failed: ${response.statusText} - ${errorText}`);
    }

    console.log("[Discord] Completion notification sent successfully");

    return {
      success: true,
      messageId: 'webhook-sent',
    };
  } catch (error) {
    console.error("[Discord] Failed to send completion notification:", error);
    Sentry.captureException(error, {
      tags: { integration: "discord", operation: "send_completion_notification" },
      extra: { data },
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper functions
function getPainScoreColor(score: number): number {
  if (score >= 80) return 0xff0000; // Red - High pain
  if (score >= 60) return 0xffa500; // Orange - Medium pain
  if (score >= 40) return 0xffff00; // Yellow - Low-medium pain
  return 0x00ff00; // Green - Low pain
}

function getLevelColor(level: string): number {
  switch (level) {
    case "error": return 0xff0000; // Red
    case "warning": return 0xffa500; // Orange
    case "info": return 0x0099ff; // Blue
    default: return 0x808080; // Gray
  }
}

function getLevelEmoji(level: string): string {
  switch (level) {
    case "error": return "🚨";
    case "warning": return "⚠️";
    case "info": return "ℹ️";
    default: return "📢";
  }
}

function formatCurrency(amount?: number | null) {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
