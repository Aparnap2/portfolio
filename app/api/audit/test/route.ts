import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("Test API route called");
    
    // Test 1: Basic response
    const basicTest = {
      message: "API route is working",
      timestamp: new Date().toISOString()
    };
    
    // Test 2: Environment variables
    const envTest = {
      hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
    };
    
    // Test 3: Database connection
    let dbTest = { status: "unknown", error: null };
    try {
      const { db } = await import("@/lib/db");
      await db.$connect();
      dbTest.status = "connected";
      await db.$disconnect();
    } catch (error: any) {
      dbTest.status = "failed";
      dbTest.error = error.message;
    }
    
    // Test 4: Redis connection
    let redisTest = { status: "unknown", error: null };
    try {
      const { redis } = await import("@/lib/redis");
      await redis.set("test-key", "test-value");
      const result = await redis.get("test-key");
      redisTest.status = result === "test-value" ? "connected" : "failed";
    } catch (error: any) {
      redisTest.status = "failed";
      redisTest.error = error.message;
    }
    
    // Test 5: Google AI API
    let aiTest = { status: "unknown", error: null };
    try {
      if (process.env.GOOGLE_API_KEY) {
        const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
        const llm = new ChatGoogleGenerativeAI({
          model: "gemini-1.5-pro",
          temperature: 0.3,
          apiKey: process.env.GOOGLE_API_KEY,
        });
        
        const response = await llm.invoke([{ content: "Hello, this is a test." }]);
        aiTest.status = response.content ? "connected" : "failed";
      } else {
        aiTest.status = "no-api-key";
      }
    } catch (error: any) {
      aiTest.status = "failed";
      aiTest.error = error.message;
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        basic: basicTest,
        environment: envTest,
        database: dbTest,
        redis: redisTest,
        ai: aiTest
      }
    });
    
  } catch (error: any) {
    console.error("Test API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}