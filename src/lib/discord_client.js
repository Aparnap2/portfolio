import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const redis = Redis.fromEnv();

const log = {
  info: (...args) => console.log("[DISCORD]", ...args),
  warn: (...args) => console.warn("[DISCORD]", ...args),
  error: (...args) => console.error("[DISCORD]", ...args),
};

class DiscordNotifier {
  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    this.avatarUrl = process.env.DISCORD_AVATAR_URL || 'https://cdn.discordapp.com/avatars/1025723704696881152/4d71ccdf6133094bb1e7610da4e4e6c1.png';
    this.botName = process.env.DISCORD_BOT_NAME || 'Aparna\'s AI Assistant';
  }

  // Send rich embed notification for lead capture
  async sendLeadNotification(leadData, options = {}) {
    if (!this.webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL environment variable is required');
    }

    try {
      const embed = this.createLeadEmbed(leadData, options);

      const payload = {
        username: this.botName,
        avatar_url: this.avatarUrl,
        embeds: [embed],
        // Add main content message
        content: this.getLeadAlertMessage(leadData)
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord webhook error: ${response.status} - ${errorText}`);
      }

      // Discord webhooks return 204 No Content on success
      let result = { success: true };
      try {
        const text = await response.text();
        if (text && text.trim()) {
          result = JSON.parse(text);
        }
      } catch (parseError) {
        // Empty response is expected for 204, so ignore parsing errors
        log.debug('Discord returned empty or non-JSON response:', parseError.message);
      }

      log.info(`Discord lead notification sent for: ${leadData.email}`);
      return { success: true, messageId: result.id || 'sent', embed };

    } catch (error) {
      log.error('Failed to send Discord lead notification:', error);
      throw error;
    }
  }

  // Send simple notification for non-lead events
  async sendNotification(messageData, options = {}) {
    if (!this.webhookUrl) {
      throw new Error('DISCORD_WEBHOOK_URL environment variable is required');
    }

    try {
      const embed = this.createGeneralEmbed(messageData, options);

      const payload = {
        username: this.botName,
        avatar_url: this.avatarUrl,
        embeds: [embed],
        content: messageData.mentions ? messageData.mentions.join(' ') : undefined
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord webhook error: ${response.status} - ${errorText}`);
      }

      // Discord webhooks return 204 No Content on success
      let result = { success: true };
      try {
        const text = await response.text();
        if (text && text.trim()) {
          result = JSON.parse(text);
        }
      } catch (parseError) {
        // Empty response is expected for 204, so ignore parsing errors
        log.debug('Discord returned empty or non-JSON response:', parseError.message);
      }

      log.info('Discord notification sent successfully');
      return { success: true, messageId: result.id || 'sent' };

    } catch (error) {
      log.error('Failed to send Discord notification:', error);
      throw error;
    }
  }

  // Create rich embed for lead notifications
  createLeadEmbed(leadData, options = {}) {
    const isUrgent = leadData.lead_score >= 85;
    const color = isUrgent ? 0xFF6B6B : (leadData.lead_score >= 70 ? 0xFFA500 : 0x00FF00);

    const embed = {
      title: `${isUrgent ? '🔥 Hot Lead Alert!' : '📋 New Lead Captured'}`,
      description: `**${leadData.name || 'Unknown'}** is interested in AI automation solutions`,
      color: color,
      timestamp: new Date().toISOString(),
      fields: [
        {
          name: '👤 Contact Information',
          value: `**Email:** ${leadData.email}\n**Name:** ${leadData.name || 'N/A'}\n**Company:** ${leadData.company || 'N/A'}\n**Phone:** ${leadData.phone || 'N/A'}`,
          inline: false
        },
        {
          name: '📊 Lead Quality',
          value: `**Score:** ${leadData.lead_score || 0}/100\n**Quality:** ${this.getLeadQualityDescription(leadData.lead_score)}\n**Priority:** ${isUrgent ? '🔴 URGENT' : '🟡 Normal'}`,
          inline: true
        },
        {
          name: '💰 Budget & Timeline',
          value: `**Budget:** ${leadData.budget || 'Not specified'}\n**Timeline:** ${leadData.timeline || 'Not specified'}\n**Company Size:** ${leadData.company_size || 'Not specified'}`,
          inline: true
        }
      ],
      footer: {
        text: 'Captured via AI Assistant • Automatic Lead Qualification',
        icon_url: 'https://cdn.discordapp.com/avatars/1025723704696881152/4d71ccdf6133094bb1e7610da4e4e6c1.png'
      }
    };

    // Add requirements field if available
    if (leadData.requirements) {
      embed.fields.push({
        name: '🎯 Requirements',
        value: leadData.requirements,
        inline: false
      });
    }

    // Add conversation summary if available
    if (leadData.conversation_summary) {
      embed.fields.push({
        name: '💬 Conversation Summary',
        value: leadData.conversation_summary,
        inline: false
      });
    }

    // Add industry field if available
    if (leadData.industry) {
      embed.fields.push({
        name: '🏢 Industry',
        value: leadData.industry,
        inline: true
      });
    }

    // Add current challenges if available
    if (leadData.current_challenges) {
      embed.fields.push({
        name: '⚠️ Current Challenges',
        value: leadData.current_challenges,
        inline: false
      });
    }

    return embed;
  }

  // Create general embed for notifications
  createGeneralEmbed(messageData, options = {}) {
    const embed = {
      title: messageData.title || '📢 System Notification',
      description: messageData.description || 'System update',
      color: this.getColorFromType(options.type || 'info'),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Aparna\'s AI Assistant • Automated Notification',
        icon_url: 'https://cdn.discordapp.com/avatars/1025723704696881152/4d71ccdf6133094bb1e7610da4e4e6c1.png'
      }
    };

    if (messageData.fields) {
      embed.fields = messageData.fields;
    }

    return embed;
  }

  // Get alert message content
  getLeadAlertMessage(leadData) {
    const isUrgent = leadData.lead_score >= 85;
    const mentions = process.env.DISCORD_MENTION_ROLES || '';

    if (isUrgent) {
      return `${mentions} 🔥 **IMMEDIATE ATTENTION REQUIRED** - High-value lead captured!`;
    } else if (leadData.lead_score >= 70) {
      return `${mentions} 📈 **Qualified Lead** - Good opportunity for follow-up`;
    } else {
      return `📋 **New Lead** - Information captured for nurturing`;
    }
  }

  // Get lead quality description
  getLeadQualityDescription(score) {
    if (score >= 85) return '🔥 Hot Lead - Immediate Follow-up Required';
    if (score >= 70) return '📈 Qualified Lead - High Priority';
    if (score >= 50) return '👥 Warm Lead - Good Potential';
    return '❄️ Cold Lead - Nurturing Required';
  }

  // Get color based on notification type
  getColorFromType(type) {
    const colors = {
      success: 0x00FF00,    // Green
      error: 0xFF0000,      // Red
      warning: 0xFFA500,    // Orange
      info: 0x0099FF,       // Blue
      lead: 0x800080        // Purple
    };
    return colors[type] || colors.info;
  }

  // Schedule follow-up reminder in Discord
  async scheduleFollowUpReminder(leadData, followUpData, options = {}) {
    try {
      const daysUntilFollowUp = options.daysUntilFollowUp || 1;
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + daysUntilFollowUp);

      const embed = {
        title: '⏰ Follow-up Reminder',
        description: `Scheduled follow-up for **${leadData.name || leadData.email}**`,
        color: 0xFFA500,
        timestamp: followUpDate.toISOString(),
        fields: [
          {
            name: '📅 Follow-up Date',
            value: followUpDate.toLocaleDateString(),
            inline: true
          },
          {
            name: '👤 Contact',
            value: `${leadData.name || 'N/A'}\n${leadData.email}`,
            inline: true
          },
          {
            name: '💬 Note',
            value: followUpData.note || 'General follow-up required',
            inline: false
          }
        ],
        footer: {
          text: 'Automated Follow-up Reminder • AI Assistant'
        }
      };

      const payload = {
        username: this.botName,
        avatar_url: this.avatarUrl,
        embeds: [embed],
        content: process.env.DISCORD_MENTION_ROLES || ''
      };

      // For now, we'll send immediately. In production, you'd want to use a scheduling system
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to schedule follow-up: ${response.status}`);
      }

      log.info(`Follow-up reminder scheduled for: ${leadData.email}`);
      return { success: true, followUpDate };

    } catch (error) {
      log.error('Failed to schedule follow-up reminder:', error);
      throw error;
    }
  }

  // Send daily analytics report
  async sendDailyAnalytics(analyticsData) {
    try {
      const embed = {
        title: '📊 Daily Lead Analytics Report',
        description: `Performance metrics for ${new Date().toLocaleDateString()}`,
        color: 0x0099FF,
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: '📈 Total Leads',
            value: analyticsData.totalLeads?.toString() || '0',
            inline: true
          },
          {
            name: '🎯 Qualified Leads',
            value: analyticsData.qualifiedLeads?.toString() || '0',
            inline: true
          },
          {
            name: '🔥 Hot Leads',
            value: analyticsData.hotLeads?.toString() || '0',
            inline: true
          },
          {
            name: '💰 Average Lead Score',
            value: analyticsData.averageScore?.toFixed(1) || '0.0',
            inline: true
          },
          {
            name: '🔄 Conversion Rate',
            value: `${analyticsData.conversionRate?.toFixed(1) || '0.0'}%`,
            inline: true
          }
        ],
        footer: {
          text: 'Automated Daily Report • AI Lead Capture System',
          icon_url: 'https://cdn.discordapp.com/avatars/1025723704696881152/4d71ccdf6133094bb1e7610da4e4e6c1.png'
        }
      };

      const payload = {
        username: this.botName,
        avatar_url: this.avatarUrl,
        embeds: [embed]
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to send analytics: ${response.status}`);
      }

      log.info('Daily analytics report sent to Discord');
      return { success: true };

    } catch (error) {
      log.error('Failed to send daily analytics:', error);
      throw error;
    }
  }
}

// Singleton instance
let discordNotifierInstance = null;

function getDiscordNotifier() {
  if (!discordNotifierInstance) {
    discordNotifierInstance = new DiscordNotifier();
  }
  return discordNotifierInstance;
}

// Main export functions
export async function sendLeadToDiscord(leadData, options = {}) {
  const notifier = getDiscordNotifier();
  return await notifier.sendLeadNotification(leadData, options);
}

export async function sendNotificationToDiscord(messageData, options = {}) {
  const notifier = getDiscordNotifier();
  return await notifier.sendNotification(messageData, options);
}

export async function scheduleDiscordFollowUp(leadData, followUpData, options = {}) {
  const notifier = getDiscordNotifier();
  return await notifier.scheduleFollowUpReminder(leadData, followUpData, options);
}

export async function sendDailyAnalyticsToDiscord(analyticsData) {
  const notifier = getDiscordNotifier();
  return await notifier.sendDailyAnalytics(analyticsData);
}

export { getDiscordNotifier };