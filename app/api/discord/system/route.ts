import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordSystemAlert } from '@/lib/integrations/discord';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { message } = body;
    
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    const level = body.level || 'info';
    const context = body.context || {};

    // Send Discord system notification
    const result = await sendDiscordSystemAlert(message, level);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      throw new Error(result.error || 'Failed to send Discord system notification');
    }

  } catch (error) {
    console.error('[API] Discord system notification error:', error);
    
    Sentry.captureException(error, {
      tags: { 
        component: 'discord_api',
        route: '/api/discord/system'
      },
      extra: { 
        body: await req.clone().json().catch(() => ({}))
      }
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
