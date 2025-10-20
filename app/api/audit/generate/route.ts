import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compiledAuditWorkflow } from "@/lib/workflows/audit-workflow";

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    
    // Load session with all data
    const session = await db.auditSession.findUnique({
      where: { sessionId },
      include: {
        opportunities: {
          include: { template: true },
          orderBy: { rank: "asc" }
        }
      }
    });
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }
    
    // If opportunities already exist, return them
    if (session.opportunities.length > 0) {
      return NextResponse.json({
        success: true,
        opportunities: session.opportunities,
        roadmap: session.roadmap,
        reportUrl: `/audit/report/${sessionId}`,
      });
    }
    
    // Otherwise, run matching + report generation
    const state = {
      sessionId,
      ...session,
      currentPhase: "matching"
    };
    
    const result = await compiledAuditWorkflow.invoke(state, {
      startFrom: "match_opportunities"
    });
    
    if (result.errors && result.errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors: result.errors,
      }, { status: 500 });
    }
    
    // Fetch generated opportunities
    const opportunities = await db.auditOpportunity.findMany({
      where: { sessionId },
      include: { template: true },
      orderBy: { rank: "asc" }
    });
    
    return NextResponse.json({
      success: true,
      opportunities,
      roadmap: result.roadmap,
      reportUrl: `/audit/report/${sessionId}`,
    });
    
  } catch (error) {
    console.error("[API] Generate error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}