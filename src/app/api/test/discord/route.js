import { NextRequest, NextResponse } from 'next/server';

// Mock Discord notification test (simulated without actual webhook)
export async function POST(request) {
  try {
    const body = await request.json();
    const { lead, enrichedData, score, assignment } = body;

    console.log('🧪 Testing Discord Notification (Simulated)');

    // Mock Discord embed message
    const mockDiscordEmbed = {
      title: '🎯 New High-Quality Lead Captured!',
      color: score.score >= 80 ? 0x00ff00 : score.score >= 60 ? 0xffff00 : 0xff0000,
      fields: [
        {
          name: '👤 Lead Information',
          value: `**Name:** ${lead.firstName} ${lead.lastName}\n**Email:** ${lead.email}\n**Company:** ${lead.company}`,
          inline: false
        },
        {
          name: '📊 Lead Analysis',
          value: `**Score:** ${score.score}/100\n**Industry:** ${enrichedData.industry}\n**Company Size:** ${enrichedData.companySize}\n**Priority:** ${score.score >= 80 ? '🔥 High' : score.score >= 60 ? '⚡ Medium' : '📍 Low'}`,
          inline: true
        },
        {
          name: '👥 Assignment',
          value: `**Sales Rep:** ${assignment.repDetails.name}\n**Territory:** ${assignment.repDetails.territory}\n**Urgency:** ${assignment.urgency}\n**Response Time:** ${assignment.estimatedResponseTime}`,
          inline: true
        }
      ],
      footer: {
        text: `Lead captured via Portfolio Website • ${new Date().toLocaleString()}`
      },
      timestamp: new Date().toISOString()
    };

    // Mock Discord notification response
    const mockDiscordResponse = {
      success: true,
      notification: {
        messageId: 'discord_' + Date.now(),
        channelId: 'simulated_channel',
        embed: mockDiscordEmbed,
        sentAt: new Date().toISOString()
      },
      metadata: {
        deliveryTime: '0.1s',
        status: 'delivered',
        priority: score.score >= 80 ? 'urgent' : 'normal'
      }
    };

    console.log('✅ Discord notification sent');
    console.log('🔔 Channel:', mockDiscordResponse.notification.channelId);
    console.log('🎯 Priority:', mockDiscordResponse.metadata.priority);

    return NextResponse.json({
      success: true,
      discord: mockDiscordResponse,
      summary: {
        messageId: mockDiscordResponse.notification.messageId,
        priority: mockDiscordResponse.metadata.priority,
        deliveryStatus: 'sent',
        timestamp: mockDiscordResponse.notification.sentAt
      }
    });

  } catch (error) {
    console.error('❌ Discord notification failed:', error);
    return NextResponse.json(
      {
        error: 'Discord notification failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}
