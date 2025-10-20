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
        opportunities: session.opportunities,
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