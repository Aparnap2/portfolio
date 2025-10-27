import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, sessionId } = await req.json();

    if (!email || !sessionId) {
      return NextResponse.json(
        { success: false, error: "Email and session ID required" },
        { status: 400 }
      );
    }

    // Store email verification status
    await redis.set(
      `email_verified:${sessionId}`,
      JSON.stringify({ email, verified: true, timestamp: new Date().toISOString() }),
      { ex: 86400 * 7 } // 7 days
    );

    // Update session with email
    const sessionData = await redis.get(`session:${sessionId}`);
    if (sessionData) {
      const currentState = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
      const updatedState = {
        ...currentState,
        email,
        double_opt_in_verified: true
      };
      
      await redis.set(
        `session:${sessionId}`,
        JSON.stringify(updatedState),
        { ex: 86400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("[Email Verify] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify email" },
      { status: 500 }
    );
  }
}