import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { compiledAuditWorkflowV3 } from "@/lib/workflows/audit-workflow-v3";
import { HumanMessage } from "@langchain/core/messages";
import { withErrorHandler, validateBody, checkRateLimit, handleCORS, getSecurityHeaders } from "@/lib/error-handling";
import { getClientIP } from "@/lib/utils";

async function handler(req: NextRequest) {
  console.log("[API] Starting audit session...");
  
  // Check CORS
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  // Rate limiting
  const ip = await getClientIP(req);
  checkRateLimit(`audit:start:${ip}`, 5, 60 * 60 * 1000); // 5 requests per hour per IP

  const body = await req.json();
  const { ipAddress, userAgent, utmParams } = validateBody(body, {
    ipAddress: { required: false, type: "string" },
    userAgent: { required: false, type: "string" },
    utmParams: { required: false, type: "object" },
  });

  const sessionId = nanoid(16);
  console.log("[API] Generated session ID:", sessionId);
  
  // Create audit session in database first (PRD requirement)
  const session = await db.auditSession.create({
    data: {
      sessionId,
      ipAddress,
      userAgent,
      currentPhase: "discovery",
      completionPercent: 0,
      status: "in_progress",
    }
  });
  console.log("[API] Created session in database:", session.id);

  // Also store in Redis for session state
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({
      sessionId,
      current_step: "discovery",
      startedAt: new Date().toISOString(),
    }),
    { ex: 86400 } // 24 hour TTL
  );
  console.log("[API] Stored session in Redis");

  // Initialize workflow with session ID and PostgreSQL persistence
  const config = {
    configurable: { 
      thread_id: sessionId, // LangGraph threading for persistence
      sessionId,
    },
    recursion_limit: 50, // Prevent infinite loops
  };
  
  const initialState = {
    messages: [],
    sessionId,
    current_step: "discovery" as const,
    extracted_data: {},
    opportunities: [],
    roadmap: null,
    painScore: 0
  };

  console.log("[API] Invoking workflow with state:", initialState);
  const firstStep = await compiledAuditWorkflowV3.invoke(initialState, config);
  console.log("[API] Workflow invoked successfully, result keys:", Object.keys(firstStep));
  
  // Store the updated state in Redis (maintain for frontend compatibility)
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({
      ...firstStep,
      updatedAt: new Date().toISOString(),
    }),
    { ex: 86400 }
  );

  return new Response(JSON.stringify({
    success: true,
    sessionId,
    response: firstStep,
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...getSecurityHeaders(),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    return await handler(req);
  } catch (error) {
    console.error("[API] Detailed error:", error);
    console.error("[API] Error stack:", error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
export const OPTIONS = withErrorHandler(async (req: NextRequest) => {
  return handleCORS(req) || new Response(null, { status: 200 });
});
