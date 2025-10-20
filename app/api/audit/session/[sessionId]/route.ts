
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const sessionId = params.sessionId;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    const session = await db.auditSession.findUnique({
      where: {
        sessionId: sessionId,
      },
      include: {
        opportunities: true, // Also fetch related opportunities
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // The frontend expects a specific structure, so we may need to map the Prisma model to the store's state shape.
    // Based on `stores/audit-store.ts`, the following fields are expected:
    // sessionId, currentPhase, completionPercent, responses, opportunities, roadmap, painScore, estimatedValue
    
    // The prisma model has a slightly different structure. Let's adapt it.
    // `responses` are spread across the model (e.g., `industry`, `companySize`). We need to gather them.
    
    const responses = {
        industry: session.industry,
        company_size: session.companySize,
        current_systems: session.currentSystems,
        acquisition_flow: session.acquisitionFlow,
        delivery_flow: session.deliveryFlow,
        manual_tasks: session.manualTasks,
        hours_per_week: session.hoursPerWeek,
        decision_bottlenecks: session.decisionBottlenecks,
        data_silos: session.dataSilos,
        visibility_gaps: session.visibilityGaps,
        budget_range: session.budgetRange,
        timeline: session.timeline,
        user_role: session.userRole,
        contact_info: {
            name: session.name,
            email: session.email,
            company: session.company,
            phone: session.phone,
        }
    };

    const sessionData = {
      sessionId: session.sessionId,
      currentPhase: session.currentPhase,
      completionPercent: session.completionPercent,
      responses: responses,
      opportunities: session.opportunities,
      roadmap: session.roadmap,
      painScore: session.painScore,
      estimatedValue: session.estimatedValue,
    };


    return NextResponse.json(sessionData, { status: 200 });
  } catch (error) {
    console.error("[API] Error fetching session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
