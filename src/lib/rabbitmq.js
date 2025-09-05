// src/lib/rabbitmq.js
// RabbitMQ service for reliable message queuing

import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

let connection = null;
let channel = null;

const CONFIG = {
  url: process.env.RABBITMQ_URL,
  exchange: process.env.RABBITMQ_EXCHANGE || 'lead_capture',
  queues: {
    hubspot: process.env.RABBITMQ_QUEUE_HUBSPOT || 'hubspot_sync',
    discord: process.env.RABBITMQ_QUEUE_DISCORD || 'discord_notifications'
  },
  retryDelay: 5000,
  maxRetries: 3
};

/**
 * Initialize RabbitMQ connection
 */
export async function initializeRabbitMQ() {
  if (connection && channel) {
    return { connection, channel };
  }

  if (!CONFIG.url) {
    throw new Error('RABBITMQ_URL environment variable is required');
  }

  try {
    console.log('🐰 Connecting to RabbitMQ...');
    connection = await amqp.connect(CONFIG.url);
    channel = await connection.createChannel();

    // Handle connection events
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed');
      connection = null;
      channel = null;
    });

    // Setup exchange
    await channel.assertExchange(CONFIG.exchange, 'direct', { durable: true });

    // Setup queues
    for (const [name, queueName] of Object.entries(CONFIG.queues)) {
      await channel.assertQueue(queueName, { 
        durable: true,
        arguments: {
          'x-message-ttl': 24 * 60 * 60 * 1000, // 24 hours TTL
          'x-max-retries': CONFIG.maxRetries
        }
      });
      
      // Bind queue to exchange
      await channel.bindQueue(queueName, CONFIG.exchange, name);
      
      // Setup dead letter queue
      const dlqName = `${queueName}_dlq`;
      await channel.assertQueue(dlqName, { durable: true });
    }

    console.log('✅ RabbitMQ initialized successfully');
    return { connection, channel };

  } catch (error) {
    console.error('❌ Failed to initialize RabbitMQ:', error);
    throw error;
  }
}

/**
 * Get or create RabbitMQ channel
 */
export async function getChannel() {
  if (!channel || !connection) {
    await initializeRabbitMQ();
  }
  return channel;
}

/**
 * Publish message to queue
 */
export async function publishMessage(queueType, payload, options = {}) {
  try {
    const ch = await getChannel();
    const queueName = CONFIG.queues[queueType];
    
    if (!queueName) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }

    const message = {
      id: uuidv4(),
      type: queueType,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0,
      ...options
    };

    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    const published = await ch.publish(
      CONFIG.exchange,
      queueType,
      messageBuffer,
      {
        persistent: true,
        messageId: message.id,
        timestamp: Date.now(),
        ...options.publishOptions
      }
    );

    if (published) {
      console.log(`📤 Message published to ${queueType}:`, message.id);
      return message.id;
    } else {
      throw new Error('Failed to publish message');
    }

  } catch (error) {
    console.error(`❌ Failed to publish message to ${queueType}:`, error);
    throw error;
  }
}

/**
 * Consume messages from queue
 */
export async function consumeMessages(queueType, handler, options = {}) {
  try {
    const ch = await getChannel();
    const queueName = CONFIG.queues[queueType];
    
    if (!queueName) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }

    const { prefetch = 1 } = options;
    await ch.prefetch(prefetch);

    console.log(`👂 Starting to consume messages from ${queueType}`);

    await ch.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        console.log(`📥 Processing message ${content.id} from ${queueType}`);

        // Call the handler
        await handler(content, msg);

        // Acknowledge the message
        ch.ack(msg);
        console.log(`✅ Message ${content.id} processed successfully`);

      } catch (error) {
        console.error(`❌ Error processing message:`, error);
        
        // Check retry count
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        
        if (retryCount <= CONFIG.maxRetries) {
          // Retry the message
          console.log(`🔄 Retrying message (attempt ${retryCount}/${CONFIG.maxRetries})`);
          
          setTimeout(() => {
            ch.publish(
              CONFIG.exchange,
              queueType,
              msg.content,
              {
                ...msg.properties,
                headers: {
                  ...msg.properties.headers,
                  'x-retry-count': retryCount
                }
              }
            );
            ch.ack(msg);
          }, CONFIG.retryDelay * retryCount);
          
        } else {
          // Send to dead letter queue
          console.log(`💀 Message exceeded max retries, sending to DLQ`);
          const dlqName = `${queueName}_dlq`;
          
          await ch.publish('', dlqName, msg.content, {
            persistent: true,
            headers: {
              'x-original-queue': queueName,
              'x-failed-at': new Date().toISOString(),
              'x-error': error.message
            }
          });
          
          ch.ack(msg);
        }
      }
    });

  } catch (error) {
    console.error(`❌ Failed to consume messages from ${queueType}:`, error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueType) {
  try {
    const ch = await getChannel();
    const queueName = CONFIG.queues[queueType];
    
    if (!queueName) {
      throw new Error(`Unknown queue type: ${queueType}`);
    }

    const queueInfo = await ch.checkQueue(queueName);
    return {
      queue: queueName,
      messageCount: queueInfo.messageCount,
      consumerCount: queueInfo.consumerCount
    };

  } catch (error) {
    console.error(`❌ Failed to get queue stats for ${queueType}:`, error);
    return null;
  }
}

/**
 * Health check for RabbitMQ
 */
export async function healthCheck() {
  try {
    if (!connection || !channel) {
      return {
        status: 'unhealthy',
        error: 'No connection established',
        timestamp: new Date().toISOString()
      };
    }

    // Try to get queue stats as a health check
    const stats = await Promise.all(
      Object.keys(CONFIG.queues).map(async (queueType) => {
        const stat = await getQueueStats(queueType);
        return { [queueType]: stat };
      })
    );

    return {
      status: 'healthy',
      queues: Object.assign({}, ...stats),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Close RabbitMQ connection
 */
export async function closeRabbitMQ() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log('🐰 RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
  }
}

// Queue-specific helper functions

/**
 * Queue HubSpot sync job
 */
export async function queueHubSpotSync(leadData) {
  return await publishMessage('hubspot', {
    action: 'sync_lead',
    lead: leadData,
    priority: 'normal'
  });
}

/**
 * Queue Discord notification
 */
export async function queueDiscordNotification(notificationData) {
  return await publishMessage('discord', {
    action: 'send_notification',
    notification: notificationData,
    priority: 'high'
  });
}

export default {
  initializeRabbitMQ,
  getChannel,
  publishMessage,
  consumeMessages,
  getQueueStats,
  healthCheck,
  closeRabbitMQ,
  queueHubSpotSync,
  queueDiscordNotification
};