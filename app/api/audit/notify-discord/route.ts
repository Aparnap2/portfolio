import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { sendDiscordAlert } from "@/lib/integrations/discord";
import { createGoogleDoc } from "@/lib/integrations/google-docs";

interface NotifyDiscordRequest {
  sessionId: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = (await req.json()) as NotifyDiscordRequest;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Load session data from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const session = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const info = session.extracted_info;
    
    // Create Google Doc with audit report
    const docResult = await createGoogleDoc({
      company: info?.company,
      industry: info?.industry,
      size: info?.size,
      opportunities: session.opportunities,
      report_content: session.report_content
    });

    // Send Discord notification with Google Doc link
    const discordResult = await sendDiscordAlert({
      sessionId: sessionId,
      name: info?.company || 'Anonymous',
      email: session.email || 'No email provided',
      company: info?.company || 'No company provided',
      painScore: 75,
      estimatedValue: session.opportunities?.reduce((sum: number, opp: any) => sum + (opp.monthly_savings * 12), 0) || 0,
      timeline: info?.timeline || 'Not specified',
      budgetRange: info?.budget || 'Not specified',
      userRole: 'Lead',
      topOpportunity: session.opportunities?.[0]?.name || 'No opportunities generated',
      googleDocUrl: docResult.docUrl
    });

    if (discordResult.success) {
      return NextResponse.json({
        success: true,
        message: "Discord notification sent successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: discordResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error("[API] Discord notification error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
