/**
 * Discord Bot Message Sender
 * Sends notifications via Discord.js bot instead of webhooks
 */

import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import * as Sentry from "@sentry/nextjs";

let botClient: Client | null = null;

interface DiscordNotification {
  sessionId: string;
  name: string;
  email: string;
  company?: string;
  painScore?: number;
  estimatedValue?: number;
  timeline?: string;
  budgetRange?: string;
  topOpportunity?: string;
}

/**
 * Initialize bot client for sending messages
 */
export function initializeBotSender(client: Client) {
  botClient = client;
  console.log('[Discord Bot Sender] Initialized');
}

/**
 * Send lead notification via bot
 */
export async function sendBotNotification(data: DiscordNotification) {
  if (!botClient || !botClient.isReady()) {
    console.warn('[Discord Bot] Bot not ready, skipping notification');
    return { success: false, error: 'Bot not ready' };
  }

  const channelId = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;
  if (!channelId) {
    console.warn('[Discord Bot] DISCORD_NOTIFICATION_CHANNEL_ID not set');
    return { success: false, error: 'Channel ID not configured' };
  }

  try {
    const channel = await botClient.channels.fetch(channelId) as TextChannel;
    
    if (!channel || !channel.isTextBased()) {
      throw new Error('Channel not found or not a text channel');
    }

    const color = getPainScoreColor(data.painScore || 0);
    
    const embed = new EmbedBuilder()
      .setTitle('🎯 New AI Audit Lead')
      .setColor(color)
      .addFields(
        {
          name: '👤 Contact',
          value: `**Name:** ${data.name}\n**Email:** ${data.email}\n**Company:** ${data.company || 'Not specified'}`,
          inline: true,
        },
        {
          name: '📊 Qualification',
          value: `**Pain Score:** ${data.painScore || 0}/100\n**Timeline:** ${data.timeline || 'Not specified'}\n**Budget:** ${data.budgetRange || 'Not specified'}`,
          inline: true,
        },
        {
          name: '💰 Value',
          value: `**Estimated:** $${(data.estimatedValue || 0).toLocaleString()}`,
          inline: true,
        }
      )
      .setFooter({ text: `Session ID: ${data.sessionId}` })
      .setTimestamp();

    // Add top opportunity if available
    if (data.topOpportunity) {
      embed.addFields({
        name: '🚀 Top Opportunity',
        value: data.topOpportunity,
        inline: false,
      });
    }

    const message = await channel.send({ embeds: [embed] });

    console.log('[Discord Bot] Notification sent successfully');
    
    return {
      success: true,
      messageId: message.id,
      channelId: channel.id,
    };

  } catch (error) {
    console.error('[Discord Bot] Failed to send notification:', error);
    Sentry.captureException(error, {
      tags: { integration: 'discord_bot', operation: 'send_notification' },
      extra: { data },
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send system alert via bot
 */
export async function sendBotSystemAlert(message: string, level: 'info' | 'warning' | 'error') {
  if (!botClient || !botClient.isReady()) {
    return { success: false, error: 'Bot not ready' };
  }

  const channelId = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;
  if (!channelId) {
    return { success: false, error: 'Channel ID not configured' };
  }

  try {
    const channel = await botClient.channels.fetch(channelId) as TextChannel;
    
    const color = getLevelColor(level);
    const emoji = getLevelEmoji(level);
    
    const embed = new EmbedBuilder()
      .setTitle(`${emoji} System Alert`)
      .setDescription(message)
      .setColor(color)
      .setTimestamp();

    const sentMessage = await channel.send({ embeds: [embed] });

    return {
      success: true,
      messageId: sentMessage.id,
    };

  } catch (error) {
    console.error('[Discord Bot] Failed to send system alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
    case 'error': return 0xff0000; // Red
    case 'warning': return 0xffa500; // Orange
    case 'info': return 0x0099ff; // Blue
    default: return 0x808080; // Gray
  }
}

function getLevelEmoji(level: string): string {
  switch (level) {
    case 'error': return '🚨';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📢';
  }
}
