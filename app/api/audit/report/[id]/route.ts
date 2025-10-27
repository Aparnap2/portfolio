import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET route to fetch audit report
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }
    
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
    
    // Also fetch opportunities separately to ensure they're included
    // Note: We need to use the actual session ID, not the sessionId field
    console.log(`[API] Looking for opportunities with session ID: ${session.id}`);
    const opportunities = await db.auditOpportunity.findMany({
      where: { sessionId: session.id }, // Use the database ID as foreign key
      include: { template: true },
      orderBy: { rank: "asc" }
    });
    console.log(`[API] Found ${opportunities.length} opportunities`);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Audit session not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        session,
        opportunities: opportunities, // Use the separately fetched opportunities
        roadmap: session.roadmap,
        painScore: session.painScore,
        estimatedValue: session.estimatedValue,
      }
    });
    
  } catch (error) {
    console.error("[API] Fetch report error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}