/**
 * Discord Worker - Processes Discord notifications via RabbitMQ
 * Replaces database workers with HubSpot + Discord integration
 */

import amqp from 'amqplib';
import { sendLeadNotification, sendSystemNotification } from '../lib/discord-service.js';
import { getContactById } from '../lib/hubspot-service.js';

const RABBITMQ_URL = process.env.CLOUDAMQP_URL || process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'discord_notifications';

class DiscordWorker {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('🔄 Connecting to RabbitMQ...');
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Ensure queue exists
      await this.channel.assertQueue(QUEUE_NAME, {
        durable: true,
        arguments: {
          'x-max-priority': 10 // Support priority queues
        }
      });

      // Set prefetch for optimal performance
      await this.channel.prefetch(5);

      this.isConnected = true;
      console.log('✅ Connected to RabbitMQ - Discord Worker ready');
      
      // Handle connection events
      this.connection.on('error', (error) => {
        console.error('❌ RabbitMQ connection error:', error);
        this.isConnected = false;
        this.reconnect();
      });

      this.connection.on('close', () => {
        console.log('🔌 RabbitMQ connection closed');
        this.isConnected = false;
        this.reconnect();
      });

    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      this.reconnect();
    }
  }

  async reconnect() {
    console.log('🔄 Attempting to reconnect in 5 seconds...');
    setTimeout(() => this.connect(), 5000);
  }

  async processMessage(message) {
    const content = JSON.parse(message.content.toString());
    
    try {
      console.log('📥 Processing Discord notification:', content.type);
      
      switch (content.type) {
        case 'new_lead':
          await this.handleNewLead(content);
          break;
          
        case 'lead_captured':
          await this.handleLeadCaptured(content);
          break;
          
        case 'system_notification':
          await this.handleSystemNotification(content);
          break;
          
        case 'contact_request':
          await this.handleContactRequest(content);
          break;
          
        default:
          console.warn('⚠️ Unknown message type:', content.type);
      }

      // Acknowledge message
      this.channel.ack(message);
      console.log('✅ Message processed successfully');
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      // Requeue message on error (with delay)
      this.channel.nack(message, false, true);
      
      // Send error notification
      await sendSystemNotification(
        `Error processing Discord notification: ${error.message}`,
        'error'
      );
    }
  }

  async handleNewLead(content) {
    const { lead, capture_id } = content.data;
    
    // Send lead notification to Discord
    await sendLeadNotification(lead, {
      id: lead.hubspotId,
      leadScore: lead.leadScore,
      isQualified: lead.isQualified
    });

    // Send system notification for qualified leads
    if (lead.isQualified) {
      await sendSystemNotification(
        `🎯 HIGH QUALITY LEAD: ${lead.name} (${lead.email}) - Score: ${lead.leadScore}/100`,
        'success'
      );
    }
  }

  async handleLeadCaptured(content) {
    const { data } = content;
    
    try {
      // Fetch additional contact data from HubSpot if needed
      if (data.hubspotId) {
        const contact = await getContactById(data.hubspotId);
        data.hubspotData = contact;
      }

      await sendLeadNotification(data, {
        id: data.hubspotId,
        leadScore: data.leadScore,
        isQualified: data.isQualified
      });
      
    } catch (error) {
      console.error('❌ Error handling lead captured:', error);
      // Still send basic notification
      await sendLeadNotification(data, {
        id: data.hubspotId,
        leadScore: data.leadScore,
        isQualified: data.isQualified
      });
    }
  }

  async handleSystemNotification(content) {
    const { message, notificationType = 'info' } = content;
    
    await sendSystemNotification(message, notificationType);
  }

  async handleContactRequest(content) {
    const { leadData } = content;
    
    await sendSystemNotification(
      `📞 Contact request from ${leadData.name} (${leadData.email}) - wants to discuss project on Discord`,
      'info'
    );
  }

  async start() {
    await this.connect();
    
    if (!this.isConnected) {
      console.error('❌ Cannot start worker - RabbitMQ connection failed');
      return;
    }

    console.log('🚀 Starting Discord worker...');
    
    // Consume messages from queue
    await this.channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        await this.processMessage(message);
      }
    });

    console.log(`✅ Discord worker listening on queue: ${QUEUE_NAME}`);
    
    // Send startup notification
    await sendSystemNotification(
      '🟢 Discord worker started and listening for notifications',
      'success'
    );
  }

  async stop() {
    console.log('🛑 Stopping Discord worker...');
    
    if (this.connection) {
      await this.connection.close();
    }
    
    console.log('✅ Discord worker stopped');
  }
}

// Start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new DiscordWorker();
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await worker.stop();
    process.exit(0);
  });

  worker.start().catch(console.error);
}

export default DiscordWorker;