/**
 * Discord Service - Send notifications to Discord via webhooks
 * Integrates with RabbitMQ for async processing
 */

import { WebhookClient, EmbedBuilder } from 'discord.js';

// Initialize Discord webhook client only if URL is provided
let webhookClient = null;
if (process.env.DISCORD_WEBHOOK_URL && process.env.DISCORD_WEBHOOK_URL !== 'your_discord_webhook_url') {
  try {
    webhookClient = new WebhookClient({
      url: process.env.DISCORD_WEBHOOK_URL
    });
  } catch (error) {
    console.warn('⚠️ Discord webhook initialization failed:', error.message);
  }
}

/**
 * Create rich embed for lead notifications
 */
function createLeadEmbed(leadData, hubspotResult) {
  const embed = new EmbedBuilder()
    .setTitle('🎯 New Lead Captured')
    .setColor(hubspotResult.isQualified ? 0x00ff00 : 0xffaa00)
    .setTimestamp()
    .addFields(
      {
        name: '👤 Contact Info',
        value: `**Name:** ${leadData.name || 'N/A'}\n**Email:** ${leadData.email}\n**Phone:** ${leadData.phone || 'N/A'}\n**Company:** ${leadData.company || 'N/A'}`,
        inline: false
      },
      {
        name: '📊 Project Details',
        value: `**Type:** ${leadData.project_type || 'N/A'}\n**Budget:** ${leadData.budget || 'N/A'}\n**Timeline:** ${leadData.timeline || 'N/A'}`,
        inline: true
      },
      {
        name: '🎯 Lead Score',
        value: `**Score:** ${hubspotResult.leadScore}/100\n**Status:** ${hubspotResult.isQualified ? '✅ QUALIFIED' : '⚡ NEW'}`,
        inline: true
      }
    );

  if (leadData.notes) {
    embed.addFields({
      name: '📝 Notes',
      value: leadData.notes.length > 1024 ? 
        leadData.notes.substring(0, 1021) + '...' : 
        leadData.notes,
      inline: false
    });
  }

  return embed;
}

/**
 * Send lead notification to Discord
 */
export async function sendLeadNotification(leadData, hubspotResult) {
  console.log('📢 [DISCORD] Attempting to send lead notification:', {
    email: leadData.email?.substring(0, 10) + '...' || 'none',
    qualified: hubspotResult?.isQualified || false,
    score: hubspotResult?.leadScore || 0,
    webhookConfigured: !!webhookClient
  });
  
  if (!webhookClient) {
    console.log('⚠️ [DISCORD] Webhook not configured, skipping notification for:', leadData.email);
    return false;
  }
  
  try {
    console.log('🎨 [DISCORD] Creating embed for lead notification...');
    const embed = createLeadEmbed(leadData, hubspotResult);
    
    const messageContent = hubspotResult.isQualified ? 
      '🔥 **HIGH QUALITY LEAD ALERT!**' : 
      '📈 New lead captured via chatbot';
    
    console.log('📤 [DISCORD] Sending webhook message:', {
      content: messageContent,
      embedFields: embed.data.fields?.length || 0
    });
    
    await webhookClient.send({
      content: messageContent,
      embeds: [embed],
      username: 'LeadBot',
      avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    });

    console.log('✅ [DISCORD] Notification sent successfully for:', leadData.email);
    return true;
  } catch (error) {
    console.error('❌ [DISCORD] Failed to send notification:', {
      error: error.message,
      code: error.code,
      status: error.status,
      email: leadData.email
    });
    return false;
  }
}

/**
 * Send system notification (errors, status updates)
 */
export async function sendSystemNotification(message, type = 'info') {
  console.log('🔔 [DISCORD] Sending system notification:', {
    type,
    messageLength: message.length,
    webhookConfigured: !!webhookClient
  });
  
  if (!webhookClient) {
    console.log('ℹ️ [DISCORD] Webhook not configured, logging system message:', message);
    return false;
  }
  
  try {
    const colors = {
      info: 0x3498db,
      success: 0x2ecc71,
      warning: 0xf39c12,
      error: 0xe74c3c
    };

    const embed = new EmbedBuilder()
      .setTitle(`System ${type.toUpperCase()}`)
      .setColor(colors[type] || colors.info)
      .setDescription(message)
      .setTimestamp();

    await webhookClient.send({
      embeds: [embed],
      username: 'SystemBot',
      avatarURL: 'https://cdn.discordapp.com/embed/avatars/1.png'
    });

    console.log('✅ System notification sent:', message);
    return true;
  } catch (error) {
    console.error('❌ Error sending system notification:', error);
    return false;
  }
}

/**
 * Send direct message link for Discord button
 */
export function getDiscordDirectLink() {
  return process.env.DISCORD_DIRECT_LINK || 'https://discord.gg/your-server';
}

/**
 * Format contact for Discord display
 */
export function formatContactForDiscord(contact) {
  return {
    embeds: [new EmbedBuilder()
      .setTitle('📞 Contact Request')
      .setDescription('A client wants to discuss their project directly on Discord')
      .setColor(0x7289da)
      .addFields(
        { name: 'Action', value: 'Click the Discord button to join the conversation', inline: false }
      )
      .setTimestamp()
    ],
    username: 'ContactBot'
  };
}

export default {
  sendLeadNotification,
  sendSystemNotification,
  getDiscordDirectLink,
  formatContactForDiscord
};