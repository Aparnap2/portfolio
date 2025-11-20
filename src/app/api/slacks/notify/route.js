import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const log = {
  info: (...args) => console.log("[SLACK]", ...args),
  warn: (...args) => console.warn("[SLACK]", ...args),
  error: (...args) => console.error("[SLACK]", ...args),
};

class SlackNotifier {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.leadsChannelId = process.env.SLACK_LEADS_CHANNEL_ID;
  }

  // Send direct message using webhook
  async sendWebhookMessage(messageData) {
    if (!this.webhookUrl) {
      throw new Error('SLACK_WEBHOOK_URL environment variable is required');
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: messageData.text,
          blocks: messageData.blocks,
          attachments: messageData.attachments,
          channel: messageData.channelId,
          username: 'Aparna\'s AI Assistant',
          icon_emoji: ':robot_face:',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Slack webhook error: ${response.status} - ${errorText}`);
      }

      log.info('Slack webhook message sent successfully');
      return await response.json();

    } catch (error) {
      log.error('Failed to send Slack webhook message:', error);
      throw error;
    }
  }

  // Send direct message using bot token (for more advanced features)
  async sendDirectMessage(userId, messageData) {
    if (!this.botToken) {
      throw new Error('SLACK_BOT_TOKEN environment variable is required for direct messages');
    }

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: userId,
          text: messageData.text,
          blocks: messageData.blocks,
          attachments: messageData.attachments,
        }),
      });

      const result = await response.json();

      if (!result.ok) {
        throw new Error(`Slack API error: ${result.error}`);
      }

      log.info(`Direct message sent to user: ${userId}`);
      return result;

    } catch (error) {
      log.error('Failed to send direct message:', error);
      throw error;
    }
  }

  // Send lead notification with rich formatting
  async sendLeadNotification(leadData, options = {}) {
    const isUrgent = leadData.lead_score >= 85;
    const color = isUrgent ? 'danger' : (leadData.lead_score >= 70 ? 'warning' : 'good');

    const messageData = {
      text: `🔔 New Lead: ${leadData.name || leadData.email}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${isUrgent ? '🔥 Hot Lead Alert!' : '📋 New Lead Captured'}`,
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Name:*\n${leadData.name || 'N/A'}`
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${leadData.email}`
            },
            {
              type: "mrkdwn",
              text: `*Company:*\n${leadData.company || 'N/A'}`
            },
            {
              type: "mrkdwn",
              text: `*Score:*\n${leadData.lead_score || 0}/100`
            }
          ]
        },
        ...(leadData.phone ? [{
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Phone:*\n${leadData.phone}`
            },
            {
              type: "mrkdwn",
              text: `*Industry:*\n${leadData.industry || 'N/A'}`
            }
          ]
        }] : []),
        ...(leadData.budget || leadData.timeline ? [{
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Budget:*\n${leadData.budget || 'N/A'}`
            },
            {
              type: "mrkdwn",
              text: `*Timeline:*\n${leadData.timeline || 'N/A'}`
            }
          ]
        }] : []),
        ...(leadData.requirements ? [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Requirements:*\n${leadData.requirements}`
          }
        }] : []),
        ...(leadData.conversation_summary ? [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Conversation Summary:*\n${leadData.conversation_summary}`
          }
        }] : []),
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "📧 Email Lead",
                emoji: true
              },
              url: `mailto:${leadData.email}`,
              style: "primary"
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "🗂️ View in HubSpot",
                emoji: true
              },
              url: `https://app.hubspot.com/contacts/${process.env.HUBSPOT_PORTAL_ID || ''}/contact/${leadData.contactId || ''}`,
              style: "default"
            },
            ...(options.enableSlackMessage ? [{
              type: "button",
              text: {
                type: "plain_text",
                text: "💬 Message on Slack",
                emoji: true
              },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/api/slacks/direct-message?email=${encodeURIComponent(leadData.email)}`,
              style: "default"
            }] : [])
          ]
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Captured via AI Assistant • <t:${Math.floor(Date.now() / 1000)}:R>`
            }
          ]
        }
      ],
      attachments: [{
        color: color,
        fields: [
          {
            title: "Lead Quality",
            value: this.getLeadQualityDescription(leadData.lead_score),
            short: true
          },
          {
            title: "Next Action",
            value: this.getNextActionRecommendation(leadData),
            short: true
          }
        ]
      }]
    };

    try {
      await this.sendWebhookMessage({
        ...messageData,
        channelId: this.leadsChannelId
      });

      log.info(`Lead notification sent for: ${leadData.email}`);
      return { success: true, messageId: 'webhook' };

    } catch (error) {
      log.error('Failed to send lead notification:', error);
      throw error;
    }
  }

  // Generate direct message link for Slack integration
  generateSlackMessageLink(leadData) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const messageData = {
      text: `Hi! I'm Aparna's AI assistant. You recently expressed interest in AI automation solutions. I'd love to connect you with Aparna to discuss your specific needs. Would you be available for a quick call this week?`,
      leadInfo: {
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        requirements: leadData.requirements
      }
    };

    // Create a unique link that contains the message data
    const encodedData = Buffer.from(JSON.stringify(messageData)).toString('base64');
    return `${baseUrl}/slack-message?data=${encodedData}`;
  }

  // Get lead quality description
  getLeadQualityDescription(score) {
    if (score >= 85) return '🔥 Hot Lead - Immediate Follow-up Required';
    if (score >= 70) return '📈 Qualified Lead - High Priority';
    if (score >= 50) return '👥 Warm Lead - Good Potential';
    return '❄️ Cold Lead - Nurturing Required';
  }

  // Get next action recommendation
  getNextActionRecommendation(leadData) {
    if (leadData.lead_score >= 85) return 'Call within 2 hours';
    if (leadData.lead_score >= 70) return 'Email within 24 hours';
    if (leadData.lead_score >= 50) return 'Email within 48 hours';
    return 'Add to nurture sequence';
  }

  // Create a direct message session for Slack integration
  async createSlackMessageSession(leadData) {
    const sessionId = `slack_${Date.now()}_${leadData.email.replace(/[^a-zA-Z0-9]/g, '')}`;

    try {
      await redis.setex(`slack_session:${sessionId}`, 7 * 24 * 60 * 60, JSON.stringify({
        leadData,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }));

      log.info(`Slack message session created: ${sessionId} for ${leadData.email}`);
      return {
        sessionId,
        messageLink: this.generateSlackMessageLink(leadData),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

    } catch (error) {
      log.error('Failed to create Slack message session:', error);
      throw error;
    }
  }
}

// Singleton instance
let slackNotifierInstance = null;

function getSlackNotifier() {
  if (!slackNotifierInstance) {
    slackNotifierInstance = new SlackNotifier();
  }
  return slackNotifierInstance;
}

export const POST = async (req) => {
  try {
    if (!req.body) {
      return new Response('Missing request body', { status: 400 });
    }

    const { text, channelId, leadData, notificationType } = await req.json();
    const notifier = getSlackNotifier();

    if (notificationType === 'lead' && leadData) {
      await notifier.sendLeadNotification(leadData, {
        enableSlackMessage: true
      });
    } else {
      await notifier.sendWebhookMessage({
        text,
        channelId: channelId || notifier.leadsChannelId
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Slack notification sent successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log.error('Slack notification failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return new Response('Missing email parameter', { status: 400 });
  }

  try {
    const notifier = getSlackNotifier();

    // Create a basic lead data object for the message
    const leadData = { email };
    const sessionData = await notifier.createSlackMessageSession(leadData);

    return new Response(JSON.stringify({
      success: true,
      ...sessionData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log.error('Failed to create Slack message session:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Note: getSlackNotifier is not exported to avoid Next.js Route export errors