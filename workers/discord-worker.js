#!/usr/bin/env node
// workers/discord-worker.js
// Standalone Discord notification worker

import dotenv from 'dotenv';
import cron from 'node-cron';
import { dequeueBatch, QUEUE_NAMES, requeue } from '../src/lib/queue.js';
import { sendLeadNotification, sendSystemAlert, initializeWebhook, healthCheck } from '../src/lib/discord.js';

dotenv.config();

const CONFIG = {
  batchSize: parseInt(process.env.DISCORD_WORKER_BATCH_SIZE) || 20,
  retryAttempts: parseInt(process.env.DISCORD_WORKER_RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.DISCORD_WORKER_RETRY_DELAY) || 2000,
  cronSchedule: process.env.DISCORD_WORKER_SCHEDULE || '*/1 * * * *', // Every minute
  runOnce: process.argv.includes('--once')
};

let isProcessing = false;
let shouldStop = false;

console.log('🤖 Discord Worker starting...');
console.log('📋 Configuration:', CONFIG);

async function processDiscordNotification(payload) {
  const { type, lead, hubspot_id, error, attempts, alert } = payload;

  try {
    switch (type) {
      case 'new_lead':
        return await sendLeadNotification(lead, 'new_lead');
      
      case 'hubspot_synced':
        return await sendLeadNotification({
          ...lead,
          hubspot_id
        }, 'hubspot_synced');
      
      case 'hubspot_failed':
        return await sendLeadNotification({
          ...lead,
          error,
          attempts
        }, 'hubspot_failed');
      
      case 'capture_failed':
        return await sendSystemAlert({
          type: 'Lead Capture Failed',
          message: `Failed to capture lead: ${error}`,
          severity: 'error',
          details: {
            'Lead Email': lead?.email || 'Unknown',
            'Lead Name': lead?.name || 'Unknown',
            'Error': error,
            'Capture ID': payload.captureId
          }
        });
      
      case 'system_alert':
        return await sendSystemAlert(alert);
      
      default:
        console.warn(`⚠️ Unknown Discord notification type: ${type}`);
        return false;
    }
  } catch (error) {
    console.error(`❌ Error processing Discord notification type ${type}:`, error);
    return false;
  }
}

async function processDiscordBatch() {
  if (isProcessing) {
    console.log('⏳ Already processing, skipping...');
    return;
  }

  isProcessing = true;
  const startTime = Date.now();

  try {
    const batch = await dequeueBatch(QUEUE_NAMES.discordNotification, CONFIG.batchSize);
    if (batch.length === 0) {
      console.log('📭 No notifications in queue');
      return;
    }

    console.log(`📦 Processing batch of ${batch.length} notifications...`);

    let processed = 0;
    let failed = 0;

    for (const job of batch) {
      if (shouldStop) {
        console.log('🛑 Stop signal received, breaking...');
        break;
      }

      const payload = job?.payload || {};

      try {
        const success = await processDiscordNotification(payload);
        
        if (success) {
          processed++;
          console.log(`✅ Sent Discord notification: ${payload.type}`);
        } else {
          throw new Error('Discord notification failed');
        }
      } catch (error) {
        failed++;
        job.attempts = (job.attempts || 0) + 1;
        
        console.error(`❌ Discord notification failed (attempt ${job.attempts}):`, error.message);
        
        if (job.attempts <= CONFIG.retryAttempts) {
          await requeue(QUEUE_NAMES.discordNotification, job);
          console.log(`🔄 Requeued notification for retry (attempt ${job.attempts}/${CONFIG.retryAttempts})`);
        } else {
          console.error(`💀 Permanently failed Discord notification after ${job.attempts} attempts:`, payload.type);
        }
      }

      // Small delay between notifications to avoid rate limiting
      if (CONFIG.retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay / 10));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`📊 Batch completed: ${processed} processed, ${failed} failed (${duration}ms)`);

  } catch (error) {
    console.error('❌ Batch processing error:', error);
  } finally {
    isProcessing = false;
  }
}

async function startWorker() {
  try {
    // Initialize Discord webhook
    const webhook = initializeWebhook();
    if (!webhook) {
      console.warn('⚠️ Discord webhook not configured, worker will run but notifications will be skipped');
    } else {
      console.log('✅ Discord webhook initialized');
    }

    // Test Discord connection
    const health = await healthCheck();
    console.log('🏥 Discord health check:', health);

    if (CONFIG.runOnce) {
      console.log('🔄 Running once...');
      await processDiscordBatch();
      process.exit(0);
    } else {
      console.log(`⏰ Scheduling worker with cron: ${CONFIG.cronSchedule}`);
      cron.schedule(CONFIG.cronSchedule, processDiscordBatch);
      console.log('✅ Discord worker started and scheduled');
      
      // Send startup notification
      try {
        await sendSystemAlert({
          type: 'Worker Started',
          message: 'Discord notification worker has started successfully',
          severity: 'info',
          details: {
            'Schedule': CONFIG.cronSchedule,
            'Batch Size': CONFIG.batchSize,
            'Retry Attempts': CONFIG.retryAttempts
          }
        });
      } catch (error) {
        console.warn('⚠️ Failed to send startup notification:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  shouldStop = true;
  
  // Wait for current processing to finish
  while (isProcessing) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Send shutdown notification
  try {
    await sendSystemAlert({
      type: 'Worker Stopped',
      message: 'Discord notification worker is shutting down',
      severity: 'warning'
    });
  } catch (error) {
    console.warn('⚠️ Failed to send shutdown notification:', error.message);
  }
  
  console.log('👋 Discord worker stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  shouldStop = true;
  
  while (isProcessing) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  try {
    await sendSystemAlert({
      type: 'Worker Stopped',
      message: 'Discord notification worker is shutting down (SIGTERM)',
      severity: 'warning'
    });
  } catch (error) {
    console.warn('⚠️ Failed to send shutdown notification:', error.message);
  }
  
  console.log('👋 Discord worker stopped');
  process.exit(0);
});

// Start the worker
startWorker();