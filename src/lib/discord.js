// src/lib/discord.js
// Discord notification service for lead alerts

import { Client, GatewayIntentBits, EmbedBuilder, WebhookClient } from 'discord.js';

const CONFIG = {
  webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  botToken: process.env.DISCORD_BOT_TOKEN,
  channelId: process.env.DISCORD_CHANNEL_ID,
  retryAttempts: 3,
  retryDelay: 2000
};

let webhookClient = null;
let botClient = null;

/**
 * Initialize Discord webhook client
 */
export function initializeWebhook() {
  if (!CONFIG.webhookUrl) {
    console.warn('⚠️ DISCORD_WEBHOOK_URL not configured, Discord notifications disabled');
    return null;
  }

  if (!webhookClient) {
    try {
      webhookClient = new WebhookClient({ url: CONFIG.webhookUrl });
      console.log('✅ Discord webhook initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Discord webhook:', error);
      return null;
    }
  }

  return webhookClient;
}

/**
 * Initialize Discord bot client
 */
export async function initializeBot() {
  if (!CONFIG.botToken) {
    console.warn('⚠️ DISCORD_BOT_TOKEN not configured, Discord bot features disabled');
    return null;
  }

  if (!botClient) {
    try {
      botClient = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages
        ]
      });

      await botClient.login(CONFIG.botToken);
      console.log('✅ Discord bot initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Discord bot:', error);
      return null;
    }
  }

  return botClient;
}

/**
 * Create lead notification embed
 */
function createLeadEmbed(leadData, type = 'new_lead') {
  const {
    id,
    email,
    name,
    company,
    phone,
    project_type,
    budget,
    timeline,
    notes,
    source,
    created_at
  } = leadData;

  const embed = new EmbedBuilder();

  switch (type) {
    case 'new_lead':
      embed
        .setTitle('🎯 New Lead Captured!')
        .setColor(0x00ff00)
        .setDescription(`A new lead has been captured from ${source}`)
        .setTimestamp(new Date(created_at));
      break;
    
    case 'hubspot_synced':
      embed
        .setTitle('✅ Lead Synced to HubSpot')
        .setColor(0x0099ff)
        .setDescription(`Lead successfully synced to HubSpot`)
        .setTimestamp();
      break;
    
    case 'hubspot_failed':
      embed
        .setTitle('❌ HubSpot Sync Failed')
        .setColor(0xff0000)
        .setDescription(`Failed to sync lead to HubSpot`)
        .setTimestamp();
      break;
    
    default:
      embed
        .setTitle('📋 Lead Update')
        .setColor(0xffff00)
        .setTimestamp();
  }

  // Add lead information fields
  embed.addFields([
    { name: '👤 Name', value: name || 'Not provided', inline: true },
    { name: '📧 Email', value: email || 'Not provided', inline: true },
    { name: '🏢 Company', value: company || 'Not provided', inline: true }
  ]);

  if (phone) {
    embed.addFields([{ name: '📞 Phone', value: phone, inline: true }]);
  }

  if (project_type) {
    embed.addFields([{ name: '🎯 Project Type', value: project_type, inline: true }]);
  }

  if (budget) {
    embed.addFields([{ name: '💰 Budget', value: budget, inline: true }]);
  }

  if (timeline) {
    embed.addFields([{ name: '⏰ Timeline', value: timeline, inline: true }]);
  }

  if (notes) {
    embed.addFields([{ name: '📝 Notes', value: notes.length > 1000 ? notes.substring(0, 1000) + '...' : notes }]);
  }

  embed.addFields([
    { name: '🆔 Lead ID', value: id, inline: true },
    { name: '📍 Source', value: source, inline: true }
  ]);

  return embed;
}

/**
 * Send notification via webhook
 */
export async function sendWebhookNotification(content, embeds = [], retryCount = 0) {
  const webhook = initializeWebhook();
  if (!webhook) {
    console.warn('⚠️ Discord webhook not available, skipping notification');
    return false;
  }

  try {
    await webhook.send({
      content,
      embeds,
      username: 'Lead Capture Bot',
      avatarURL: 'https://cdn.discordapp.com/emojis/🎯.png'
    });

    console.log('✅ Discord webhook notification sent successfully');
    return true;

  } catch (error) {
    console.error(`❌ Discord webhook notification failed (attempt ${retryCount + 1}):`, error);

    if (retryCount < CONFIG.retryAttempts) {
      console.log(`🔄 Retrying Discord notification in ${CONFIG.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      return await sendWebhookNotification(content, embeds, retryCount + 1);
    }

    return false;
  }
}

/**
 * Send notification via bot
 */
export async function sendBotNotification(content, embeds = [], retryCount = 0) {
  if (!CONFIG.channelId) {
    console.warn('⚠️ DISCORD_CHANNEL_ID not configured, cannot send bot notification');
    return false;
  }

  const bot = await initializeBot();
  if (!bot) {
    console.warn('⚠️ Discord bot not available, skipping notification');
    return false;
  }

  try {
    const channel = await bot.channels.fetch(CONFIG.channelId);
    if (!channel) {
      throw new Error(`Channel ${CONFIG.channelId} not found`);
    }

    await channel.send({
      content,
      embeds
    });

    console.log('✅ Discord bot notification sent successfully');
    return true;

  } catch (error) {
    console.error(`❌ Discord bot notification failed (attempt ${retryCount + 1}):`, error);

    if (retryCount < CONFIG.retryAttempts) {
      console.log(`🔄 Retrying Discord notification in ${CONFIG.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      return await sendBotNotification(content, embeds, retryCount + 1);
    }

    return false;
  }
}

/**
 * Send lead notification (tries webhook first, then bot)
 */
export async function sendLeadNotification(leadData, type = 'new_lead') {
  const embed = createLeadEmbed(leadData, type);
  
  let content = '';
  switch (type) {
    case 'new_lead':
      content = `🚨 **NEW LEAD ALERT** 🚨\nA new lead has been captured!`;
      break;
    case 'hubspot_synced':
      content = `✅ Lead successfully synced to HubSpot`;
      break;
    case 'hubspot_failed':
      content = `⚠️ HubSpot sync failed - lead saved locally`;
      break;
    default:
      content = `📋 Lead update notification`;
  }

  // Try webhook first (faster and more reliable)
  const webhookSuccess = await sendWebhookNotification(content, [embed]);
  
  if (!webhookSuccess) {
    // Fallback to bot if webhook fails
    console.log('🔄 Webhook failed, trying bot notification...');
    await sendBotNotification(content, [embed]);
  }

  return webhookSuccess;
}

/**
 * Send daily summary
 */
export async function sendDailySummary(summaryData) {
  const {
    totalLeads,
    newLeads,
    syncedLeads,
    failedSyncs,
    topSources,
    date
  } = summaryData;

  const embed = new EmbedBuilder()
    .setTitle('📊 Daily Lead Summary')
    .setColor(0x0099ff)
    .setDescription(`Lead capture summary for ${date}`)
    .addFields([
      { name: '📈 Total Leads', value: totalLeads.toString(), inline: true },
      { name: '🆕 New Leads', value: newLeads.toString(), inline: true },
      { name: '✅ Synced to HubSpot', value: syncedLeads.toString(), inline: true },
      { name: '❌ Failed Syncs', value: failedSyncs.toString(), inline: true },
      { name: '📍 Top Sources', value: topSources.join(', ') || 'None', inline: false }
    ])
    .setTimestamp();

  const content = `📊 **DAILY SUMMARY** - ${date}`;
  
  await sendWebhookNotification(content, [embed]);
}

/**
 * Send system alert
 */
export async function sendSystemAlert(alertData) {
  const { type, message, severity = 'warning', details = {} } = alertData;

  const colors = {
    info: 0x0099ff,
    warning: 0xffaa00,
    error: 0xff0000,
    critical: 0x990000
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨'
  };

  const embed = new EmbedBuilder()
    .setTitle(`${icons[severity]} System Alert: ${type}`)
    .setColor(colors[severity])
    .setDescription(message)
    .setTimestamp();

  if (Object.keys(details).length > 0) {
    Object.entries(details).forEach(([key, value]) => {
      embed.addFields([{ name: key, value: String(value), inline: true }]);
    });
  }

  const content = severity === 'critical' ? '@everyone' : '';
  
  await sendWebhookNotification(content, [embed]);
}

/**
 * Health check for Discord service
 */
export async function healthCheck() {
  const webhook = initializeWebhook();
  const bot = botClient;

  return {
    webhook: {
      available: !!webhook,
      configured: !!CONFIG.webhookUrl
    },
    bot: {
      available: !!bot,
      configured: !!CONFIG.botToken,
      ready: bot?.isReady() || false
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Close Discord connections
 */
export async function closeDiscord() {
  try {
    if (botClient) {
      await botClient.destroy();
      botClient = null;
    }
    if (webhookClient) {
      webhookClient.destroy();
      webhookClient = null;
    }
    console.log('🔌 Discord connections closed');
  } catch (error) {
    console.error('Error closing Discord connections:', error);
  }
}

export default {
  initializeWebhook,
  initializeBot,
  sendWebhookNotification,
  sendBotNotification,
  sendLeadNotification,
  sendDailySummary,
  sendSystemAlert,
  healthCheck,
  closeDiscord
};