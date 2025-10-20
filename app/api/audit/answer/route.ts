import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { compiledAuditWorkflowV3 } from "@/lib/workflows/audit-workflow-v3";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
  try {
    console.log("[API] Processing answer...");
    
    const { sessionId, message } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: sessionId, message" },
        { status: 400 }
      );
    }

    console.log("[API] Session ID:", sessionId, "Message:", message);

    // Load current state from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired" },
        { status: 404 }
      );
    }

    const currentState = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    console.log("[API] Current state:", currentState);

    // Reconstruct messages from serialized data
    const reconstructedMessages = currentState.messages?.map((msg: any) => {
      if (msg.lc && msg.type === 'constructor') {
        // This is a serialized LangChain message
        if (msg.id && msg.id[2] === 'AIMessage') {
          return new AIMessage(msg.kwargs);
        } else if (msg.id && msg.id[2] === 'HumanMessage') {
          return new HumanMessage(msg.kwargs);
        }
      }
      return msg;
    }) || [];

    // Add user message to state
    const updatedState = {
      ...currentState,
      messages: [
        ...reconstructedMessages,
        new HumanMessage(message)
      ]
    };

    // Configure workflow with session and PostgreSQL persistence
    const config = {
      configurable: { 
        thread_id: sessionId, // LangGraph threading for persistence
        sessionId,
      },
      recursion_limit: 50
    };

    console.log("[API] Invoking workflow with updated state...");
    // Invoke workflow with updated state
    const response = await compiledAuditWorkflowV3.invoke(updatedState, config);
    console.log("[API] Workflow response:", response);

    // Store updated state in Redis
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        ...response,
        updatedAt: new Date().toISOString()
      }),
      { ex: 86400 } // 24 hour TTL
    );

    return NextResponse.json({
      success: true,
      response,
      current_step: response.current_step,
      completed: response.current_step === 'finished'
    });

  } catch (error) {
    console.error("[API] Answer error:", error);
    console.error("[API] Answer error stack:", error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: "An unexpected error occurred.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}