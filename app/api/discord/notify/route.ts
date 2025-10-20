import { NextRequest, NextResponse } from 'next/server';
import { sendDiscordAlert } from '@/lib/integrations/discord';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { sessionId, name, email } = body;
    
    if (!sessionId || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, name, email' },
        { status: 400 }
      );
    }

    // Send Discord notification
    const result = await sendDiscordAlert({
      sessionId,
      name,
      email,
      company: body.company,
      painScore: body.painScore,
      estimatedValue: body.estimatedValue,
      timeline: body.timeline,
      topOpportunity: body.topOpportunity,
      budgetRange: body.budgetRange,
      userRole: body.userRole,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    } else {
      throw new Error(result.error || 'Failed to send Discord notification');
    }

  } catch (error) {
    console.error('[API] Discord notification error:', error);
    
    Sentry.captureException(error, {
      tags: { 
        component: 'discord_api',
        route: '/api/discord/notify'
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
