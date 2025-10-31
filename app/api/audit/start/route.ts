import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
// Simplified imports - removing missing functions
import { getClientIP } from "@/lib/utils";
import { validateAndSanitize, apiSchemas } from "@/lib/validation";
import { withTiming, MetricsCollector } from "@/lib/metrics";
import { CircuitBreaker, withRetry } from "@/lib/error-handling";

const circuitBreaker = new CircuitBreaker();
const metrics = MetricsCollector.getInstance();

const handler = withTiming(async (req: NextRequest) => {
    console.log("[API] Starting audit session...");
    console.log("[API] Request headers:", Object.fromEntries(req.headers.entries()));
    metrics.increment('api.audit.start.attempt');

    // Simplified - skip CORS and rate limiting for now
    const ip = await getClientIP(req);
    console.log("[API] Client IP:", ip);

    let body;
    try {
        body = await req.json();
        console.log("[API] Request body:", body);
    } catch (error) {
        console.error("[API] Failed to parse request body:", error);
        return new Response(JSON.stringify({
            success: false,
            error: "Invalid JSON in request body"
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    let validatedData;
    try {
        validatedData = validateAndSanitize(apiSchemas.startAudit, body);
        console.log("[API] Validated data:", validatedData);
    } catch (error) {
        console.error("[API] Validation error:", error);
        return new Response(JSON.stringify({
            success: false,
            error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }
    
    const { ipAddress, email } = validatedData;
    console.log("[API] Extracted email:", email);

    if (!email) {
        return new Response(JSON.stringify({
            success: false,
            error: "Email is required to start audit"
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    // Check for existing session with this email
    const existingSession = await db.auditSession.findFirst({
        where: { 
            email,
            status: { in: ["in_progress", "completed"] }
        },
        orderBy: { createdAt: "desc" }
    });

    if (existingSession) {
        // Load existing session from Redis
        const existingData = await redis.get(`session:${existingSession.sessionId}`);
        
        if (existingData) {
            const sessionState = typeof existingData === 'string' ? JSON.parse(existingData) : existingData;
            
            // If completed, start with LLM generation
            if (existingSession.status === "completed" || sessionState.current_step === "finished") {
                return new Response(JSON.stringify({
                    success: true,
                    sessionId: existingSession.sessionId,
                    response: {
                        ...sessionState,
                        messages: [
                            ...sessionState.messages,
                            {
                                id: nanoid(),
                                type: "ai",
                                content: "Welcome back! I see you've completed an audit before. Would you like to:\n\n1. **Continue with your previous audit** - I'll generate your updated report\n2. **Start a fresh audit** - Begin a new assessment\n\nJust let me know which you prefer!",
                                timestamp: new Date().toISOString(),
                            }
                        ],
                        current_step: "continuation_choice"
                    }
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            }
            
            // Continue from where left off
            return new Response(JSON.stringify({
                success: true,
                sessionId: existingSession.sessionId,
                response: {
                    ...sessionState,
                    messages: [
                        ...sessionState.messages,
                        {
                            id: nanoid(),
                            type: "ai",
                            content: "Welcome back! I see we were in the middle of your audit. Let's continue from where we left off.",
                            timestamp: new Date().toISOString(),
                        }
                    ]
                }
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    const sessionId = nanoid(16);
    console.log("[API] Generated session ID:", sessionId);

    // Create audit session in database with circuit breaker
    const session = await circuitBreaker.execute(() =>
        withRetry(() =>
            db.auditSession.create({
                data: {
                    sessionId,
                    ipAddress,
                    email,
                    currentPhase: "company_profile",
                    completionPercent: 0,
                    status: "in_progress",
                }
            })
        )
    );
    console.log("[API] Created session in database:", session.id);

    // Also store in Redis for session state
    await redis.set(
        `session:${sessionId}`,
        JSON.stringify({
            sessionId,
            email,
            current_step: "company_profile",
            startedAt: new Date().toISOString(),
        }),
        { ex: 86400 } // 24 hour TTL
    );
    console.log("[API] Stored session in Redis");

    // Initialize with proper workflow first message
    const firstStep = {
        messages: [
            {
                id: nanoid(),
                type: "ai",
                content: "Hi! I'm here to conduct a quick 3-step AI opportunity assessment for your business.\n\n**Step 1: Discovery**\n\nLet's start with understanding your business. What industry are you in, and how many employees do you have?",
                timestamp: new Date().toISOString(),
            }
        ],
        sessionId,
        current_step: "discovery" as const,
        extracted_info: {
            discovery: null,
            pain_points: null,
            contact_info: null
        },
        conversation_complete: false,
        needs_email: false
    };

    console.log("[API] Initialized basic state for session:", sessionId);

    // Store the updated state in Redis (maintain for frontend compatibility)
    await redis.set(
        `session:${sessionId}`,
        JSON.stringify({
            ...firstStep,
            updatedAt: new Date().toISOString(),
        }),
        { ex: 86400 }
    );

    metrics.increment('api.audit.start.success');
    
    const response = new Response(JSON.stringify({
        success: true,
        sessionId,
        response: firstStep,
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });

    return response;
}, 'api.audit.start');

export async function POST(req: NextRequest) {
    try {
        return await handler(req);
    } catch (error) {
        console.error("[API] Detailed error:", error);
        console.error("[API] Error stack:", error instanceof Error ? error.stack : 'No stack available');
        metrics.increment('api.audit.start.error');
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
export async function OPTIONS(req: NextRequest) {
    return new Response(null, { status: 200 });
}
