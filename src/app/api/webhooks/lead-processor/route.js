import { captureLeadToHubSpot } from "../../../../lib/hubspot_client.js";
import { sendLeadToDiscord } from "../../../../lib/discord_client.js";
import { Redis } from "@upstash/redis";
import { createNotificationTask } from "../../../../lib/qstash_client.js";

const redis = Redis.fromEnv();

const log = {
  info: (...args) => console.log("[LEAD_PROCESSOR]", ...args),
  warn: (...args) => console.warn("[LEAD_PROCESSOR]", ...args),
  error: (...args) => console.error("[LEAD_PROCESSOR]", ...args),
};

export const POST = async (req) => {
  const taskId = req.headers.get('X-Task-ID') || 'unknown';
  const taskType = req.headers.get('X-Task-Type');

  try {
    if (!req.body) {
      log.error(`[${taskId}] No request body received`);
      return new Response('Missing request body', { status: 400 });
    }

    const taskData = await req.json();
    log.info(`[${taskId}] Processing lead for:`, taskData.data.email);

    // Validate task data
    if (!taskData.data || !taskData.data.email) {
      log.error(`[${taskId}] Invalid task data: missing email`);
      return new Response('Invalid task data: missing email', { status: 400 });
    }

    const leadData = taskData.data;

    // Process the lead in HubSpot
    const result = await captureLeadToHubSpot(leadData);

    log.info(`[${taskId}] Lead processed successfully`);

    // Update task status
    await redis.setex(`task:${taskId}`, 60 * 60, JSON.stringify({
      ...taskData,
      status: 'completed',
      processedAt: new Date().toISOString(),
      result
    }));

    // Create notification for high-quality leads
    if (leadData.lead_score >= 70) {
      try {
        await createNotificationTask({
          type: 'high_value_lead',
          leadData,
          taskId,
          message: `High-value lead captured: ${leadData.name || leadData.email}`,
          urgency: leadData.lead_score >= 85 ? 'immediate' : 'normal'
        }, { priority: 'high' });

        log.info(`[${taskId}] High-value lead notification sent`);
      } catch (notificationError) {
        log.warn(`[${taskId}] Failed to send high-value lead notification:`, notificationError);
      }
    }

    // Send automatic notification to Discord for all leads
    try {
      await sendLeadToDiscord(leadData, {
        urgent: leadData.lead_score >= 80,
        includeFollowUp: true
      });
      log.info(`[${taskId}] Discord notification sent successfully`);
    } catch (discordError) {
      log.warn(`[${taskId}] Failed to send Discord notification:`, discordError);
    }

    // Send Slack notification as user choice option (for users who prefer Slack)
    if (leadData.lead_score >= 85 && process.env.SLACK_WEBHOOK_URL) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/slacks/notify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SLACK_WEBHOOK_SECRET || 'default'}`
          },
          body: JSON.stringify({
            text: `🔥 Hot Lead Alert!\n\n*Name:* ${leadData.name || 'N/A'}\n*Email:* ${leadData.email}\n*Company:* ${leadData.company || 'N/A'}\n*Score:* ${leadData.lead_score}/100\n*Requirements:* ${leadData.requirements || 'N/A'}\n*Budget:* ${leadData.budget || 'N/A'}\n\n💬 *Summary:* ${leadData.conversation_summary || 'N/A'}\n\n*Note: Automatic notifications sent to Discord. This is optional backup notification.*`,
            channelId: process.env.SLACK_LEADS_CHANNEL_ID || '#leads',
            notificationType: 'lead'
          })
        });

        if (response.ok) {
          log.info(`[${taskId}] Slack backup notification sent successfully`);
        } else {
          log.warn(`[${taskId}] Slack backup notification failed:`, await response.text());
        }
      } catch (slackError) {
        log.warn(`[${taskId}] Failed to send Slack backup notification:`, slackError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      taskId,
      leadEmail: leadData.email,
      leadScore: leadData.lead_score,
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log.error(`[${taskId}] Lead processing failed:`, error);

    // Update task status to failed
    try {
      const taskData = await req.json();
      await redis.setex(`task:${taskId}`, 60 * 60, JSON.stringify({
        ...taskData,
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      }));
    } catch (redisError) {
      log.error(`[${taskId}] Failed to update task status:`, redisError);
    }

    return new Response(JSON.stringify({
      success: false,
      taskId,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = async (req) => {
  // Health check endpoint
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'lead-processor',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};