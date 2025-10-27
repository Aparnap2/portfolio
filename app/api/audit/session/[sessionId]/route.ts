import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID required" },
        { status: 400 }
      );
    }

    // Get session data from Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Session not found or expired" },
        { status: 404 }
      );
    }

    const currentState = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

    return NextResponse.json({
      success: true,
      ...currentState
    });

  } catch (error) {
    console.error("[Session] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve session" },
      { status: 500 }
    );
  }
}