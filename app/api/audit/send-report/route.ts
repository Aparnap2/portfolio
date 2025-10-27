import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { createGoogleDoc } from "@/lib/integrations/google-docs";
import { sendGmailReport } from "@/lib/integrations/gmail";

interface SendReportRequest {
  sessionId: string;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email } = (await req.json()) as SendReportRequest;
    
    if (!sessionId || !email) {
      return NextResponse.json(
        { success: false, error: "Session ID and email are required" },
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
    
    if (!session.opportunities || session.opportunities.length === 0) {
      return NextResponse.json(
        { success: false, error: "No opportunities found for this session" },
        { status: 400 }
      );
    }

    // Create Google Doc with audit report
    const docResult = await createGoogleDoc({
      company: info?.company,
      industry: info?.industry,
      size: info?.size,
      opportunities: session.opportunities,
      report_content: session.report_content
    });

    // Send email with Google Doc link via Gmail
    const emailResult = await sendGmailReport(email, session, docResult.docUrl);
    
    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: "Report sent successfully"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: emailResult.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error("[API] Send report error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}




