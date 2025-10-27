import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Simple test endpoint working",
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    
    if (action === "update-session") {
      const { sessionId, email, name, company, phone, painScore, estimatedValue } = body;
      
      const updatedSession = await db.auditSession.update({
        where: { sessionId },
        data: {
          email,
          name,
          company,
          phone,
          painScore,
          estimatedValue,
          updatedAt: new Date(),
        }
      });
      
      return NextResponse.json({
        success: true,
        session: updatedSession,
        message: "Session updated successfully"
      });
    }
    
    if (action === "create-template") {
      // Create a basic template for testing
      const template = await db.opportunityTemplate.create({
        data: {
          name: "Test Template",
          slug: "test-template",
          category: "analytics",
          difficulty: "low",
          shortDescription: "Test template for debugging",
          fullDescription: "This is a test template created for debugging purposes",
          problemItSolves: "Testing opportunity creation",
          avgDevCostMin: 2000,
          avgDevCostMax: 3500,
          avgTimeSavedHrsMonth: 4,
          avgImplementationWeeks: 1,
          complexity: "simple",
          matchingRules: {},
          techStack: [],
          integrationsRequired: [],
        }
      });
      
      return NextResponse.json({
        success: true,
        template,
        message: "Template created successfully"
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "POST endpoint working",
      action
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
