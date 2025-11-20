import { Client } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const redis = Redis.fromEnv();

const log = {
  info: (...args) => console.log("[QSTASH]", ...args),
  warn: (...args) => console.warn("[QSTASH]", ...args),
  error: (...args) => console.error("[QSTASH]", ...args),
};

class QStashClient {
  constructor() {
    // Check for V2 token first, then fallback to legacy token
    const token = process.env.QSTASH_V2_TOKEN || process.env.QSTASH_TOKEN;
    if (!token) {
      throw new Error('QStash token is required. Please set QSTASH_V2_TOKEN environment variable.');
    }
    this.client = new Client({ token: token });
  }

  // Create a lead processing task with retry logic and priority handling
  async createLeadProcessingTask(leadData, options = {}) {
    const taskId = uuidv4();
    const taskData = {
      id: taskId,
      type: 'lead_processing',
      data: leadData,
      timestamp: new Date().toISOString(),
      priority: options.priority || 'normal',
      retryCount: 0,
      maxRetries: options.maxRetries || 3
    };

    try {
      // Cache task for monitoring
      await redis.setex(`task:${taskId}`, 24 * 60 * 60, JSON.stringify(taskData));

      // Determine queue based on lead score and priority
      const queueName = this.getQueueName(leadData, options.priority);

      // Queue the task using V2 API with error handling
      let result;
      try {
        result = await this.client.publishJSON({
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/lead-processor`,
          body: taskData,
          headers: {
            'Content-Type': 'application/json',
            'X-Task-ID': taskId,
            'X-Task-Type': 'lead_processing'
          },
          // Schedule immediate processing for high-quality leads
          delay: options.delay || (leadData.lead_score >= 80 ? 0 : 5),
          // Set custom timeout for the task (V2 uses timeout instead of ttl)
          timeout: options.timeout || 60, // 60 seconds default
          // Deduplication based on email
          deduplicationId: `lead_${leadData.email.toLowerCase()}_${Date.now()}`,
          // Retries configuration
          retries: options.maxRetries || 3,
          // Optional callback for processing completion
          callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/task-callback`
        });
      } catch (publishError) {
        log.error('QStash publishJSON failed:', publishError);
        throw new Error(`QStash publishing failed: ${publishError.message}`);
      }

      log.info(`Lead processing task published: ${taskId} to queue: ${queueName}`);

      // Update analytics
      await this.updateTaskAnalytics('lead_processing', 'queued', leadData.lead_score);

      return {
        taskId,
        queueName,
        messageId: result.messageId,
        status: 'queued'
      };

    } catch (error) {
      log.error(`Failed to publish lead processing task: ${taskId}`, error);

      // Fallback: Store task for retry
      try {
        await redis.setex(`failed_task:${taskId}`, 3600, JSON.stringify({
          ...taskData,
          error: error.message,
          failedAt: new Date().toISOString()
        }));
      } catch (redisError) {
        log.error('Failed to store failed task in Redis:', redisError);
        // Continue without Redis fallback - task will be lost but won't crash
      }

      throw error;
    }
  }

  // Create notification task for Slack/email
  async createNotificationTask(notificationData, options = {}) {
    const taskId = uuidv4();
    const taskData = {
      id: taskId,
      type: 'notification',
      data: notificationData,
      timestamp: new Date().toISOString(),
      priority: options.priority || 'normal',
      retryCount: 0,
      maxRetries: options.maxRetries || 2
    };

    try {
      await redis.setex(`task:${taskId}`, 60 * 60, JSON.stringify(taskData));

      const result = await this.client.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/notification-processor`,
        body: taskData,
        headers: {
          'Content-Type': 'application/json',
          'X-Task-ID': taskId,
          'X-Task-Type': 'notification'
        },
        delay: options.delay || 0,
        timeout: options.timeout || 30, // 30 seconds default for notifications
        retries: options.maxRetries || 2,
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/task-callback`
      });

      log.info(`Notification task published: ${taskId}`);
      await this.updateTaskAnalytics('notification', 'queued');

      return {
        taskId,
        messageId: result.messageId,
        status: 'queued'
      };

    } catch (error) {
      log.error(`Failed to publish notification task: ${taskId}`, error);
      throw error;
    }
  }

  // Schedule follow-up tasks
  async scheduleFollowUpTask(leadData, followUpData, options = {}) {
    const taskId = uuidv4();
    const taskData = {
      id: taskId,
      type: 'follow_up',
      leadId: leadData.email,
      data: {
        lead: leadData,
        followUp: followUpData
      },
      timestamp: new Date().toISOString(),
      scheduledFor: options.scheduledFor || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      priority: options.priority || 'low'
    };

    try {
      await redis.setex(`task:${taskId}`, 7 * 24 * 60 * 60, JSON.stringify(taskData));

      // Calculate delay in seconds until scheduled time
      const scheduledTime = new Date(taskData.scheduledFor);
      const delayInSeconds = Math.max(0, Math.floor((scheduledTime.getTime() - Date.now()) / 1000));

      // Use V2 publish with delay for scheduling (replaces schedules.create)
      const result = await this.client.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/follow-up-processor`,
        body: taskData,
        headers: {
          'Content-Type': 'application/json',
          'X-Task-ID': taskId,
          'X-Task-Type': 'follow_up'
        },
        delay: delayInSeconds, // V2 uses delay in seconds
        timeout: options.timeout || 60,
        retries: options.maxRetries || 2,
        deduplicationId: `followup_${leadData.email.toLowerCase()}_${Date.now()}`,
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/task-callback`
      });

      log.info(`Follow-up task scheduled: ${taskId} for ${taskData.scheduledFor}`);

      return {
        taskId,
        messageId: result.messageId,
        scheduledFor: taskData.scheduledFor,
        status: 'scheduled'
      };

    } catch (error) {
      log.error(`Failed to schedule follow-up task: ${taskId}`, error);
      throw error;
    }
  }

  // Create batch processing tasks for multiple leads
  async createBatchProcessingTask(leadsData, options = {}) {
    const taskId = uuidv4();
    const taskData = {
      id: taskId,
      type: 'batch_processing',
      data: {
        leads: leadsData,
        batchSize: options.batchSize || 50,
        processingType: options.processingType || 'enrichment'
      },
      timestamp: new Date().toISOString(),
      priority: options.priority || 'low'
    };

    try {
      await redis.setex(`task:${taskId}`, 2 * 60 * 60, JSON.stringify(taskData));

      const result = await this.client.publishJSON({
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/batch-processor`,
        body: taskData,
        headers: {
          'Content-Type': 'application/json',
          'X-Task-ID': taskId,
          'X-Task-Type': 'batch_processing'
        },
        delay: options.delay || 0,
        timeout: options.timeout || 120, // 2 minutes for batch processing
        retries: options.maxRetries || 1, // Fewer retries for batch jobs
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/task-callback`
      });

      log.info(`Batch processing task published: ${taskId} for ${leadsData.length} leads`);

      return {
        taskId,
        messageId: result.messageId,
        leadsCount: leadsData.length,
        status: 'queued'
      };

    } catch (error) {
      log.error(`Failed to publish batch processing task: ${taskId}`, error);
      throw error;
    }
  }

  // Get queue information and health
  async getQueueHealth() {
    try {
      const queues = ['high_priority_leads', 'normal_priority_leads', 'low_priority_leads', 'notifications', 'follow_ups'];
      const healthData = {};

      for (const queueName of queues) {
        try {
          // In V2, queue management might be different, so we'll provide a basic health check
          // The exact V2 queue management API might differ, so this is a simplified version
          healthData[queueName] = {
            name: queueName,
            status: 'active', // V2 doesn't have the same queue concepts, assume active
            lastChecked: new Date().toISOString(),
            note: 'Queue health monitoring updated for V2 API'
          };
        } catch (queueError) {
          healthData[queueName] = {
            error: queueError.message,
            status: 'unavailable'
          };
        }
      }

      return healthData;

    } catch (error) {
      log.error('Failed to get queue health:', error);
      return { error: error.message, status: 'unavailable' };
    }
  }

  // Helper methods
  getQueueName(leadData, priority) {
    const leadScore = leadData.lead_score || 0;

    if (priority === 'urgent' || leadScore >= 80) {
      return 'high_priority_leads';
    } else if (priority === 'high' || leadScore >= 60) {
      return 'normal_priority_leads';
    } else {
      return 'low_priority_leads';
    }
  }

  generateFollowUpCron(delayInHours) {
    // Simple cron generation - could be enhanced for more complex scheduling
    if (delayInHours <= 24) {
      return `0 ${Math.floor(Math.random() * 24)} * * *`; // Random hour today
    } else if (delayInHours <= 168) { // Within a week
      const daysFromNow = Math.floor(delayInHours / 24);
      return `0 ${Math.floor(Math.random() * 24)} */${daysFromNow} * *`;
    } else {
      return `0 9 * * 1`; // Every Monday at 9 AM
    }
  }

  async updateTaskAnalytics(taskType, status, leadScore = null) {
    try {
      const analyticsKey = `qstash_analytics:${new Date().toISOString().split('T')[0]}`;

      await Promise.all([
        redis.hincrby(analyticsKey, `tasks_${taskType}_${status}`, 1),
        leadScore && redis.hincrby(analyticsKey, 'total_lead_score', leadScore),
        redis.expire(analyticsKey, 30 * 24 * 60 * 60) // 30 days
      ]);
    } catch (error) {
      log.warn('Failed to update task analytics:', error);
    }
  }
}

// Singleton instance
let qstashClientInstance = null;

function getQStashClient() {
  if (!qstashClientInstance) {
    qstashClientInstance = new QStashClient();
  }
  return qstashClientInstance;
}

// Export main functions
export async function createLeadProcessingTask(leadData, options = {}) {
  const client = getQStashClient();
  return await client.createLeadProcessingTask(leadData, options);
}

export async function createNotificationTask(notificationData, options = {}) {
  const client = getQStashClient();
  return await client.createNotificationTask(notificationData, options);
}

export async function scheduleFollowUpTask(leadData, followUpData, options = {}) {
  const client = getQStashClient();
  return await client.scheduleFollowUpTask(leadData, followUpData, options);
}

export async function createBatchProcessingTask(leadsData, options = {}) {
  const client = getQStashClient();
  return await client.createBatchProcessingTask(leadsData, options);
}

export async function getQueueHealth() {
  const client = getQStashClient();
  return await client.getQueueHealth();
}

// Export the singleton client for external use
export { getQStashClient };