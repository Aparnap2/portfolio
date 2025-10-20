// Debug script to test API components individually
require('dotenv').config();

async function testComponents() {
  console.log('🔍 Testing API Components...\n');

  // Test 1: Environment Variables
  console.log('1. Environment Variables:');
  console.log('   GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Present' : '❌ Missing');
  console.log('   DATABASE_URL:', process.env.DATABASE_URL ? '✅ Present' : '❌ Missing');
  console.log('   UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL ? '✅ Present' : '❌ Missing');
  console.log('   UPSTASH_REDIS_REST_TOKEN:', process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Present' : '❌ Missing');

  // Test 2: Database Connection
  console.log('\n2. Database Connection:');
  try {
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    await db.$connect();
    console.log('   ✅ Database connection successful');
    await db.$disconnect();
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
  }

  // Test 3: Redis Connection
  console.log('\n3. Redis Connection:');
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = require('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      await redis.set('test-key', 'test-value');
      const result = await redis.get('test-key');
      console.log('   ✅ Redis connection successful, test value:', result);
    } else {
      console.log('   ⚠️ Redis credentials missing, will use mock client');
    }
  } catch (error) {
    console.log('   ❌ Redis connection failed:', error.message);
  }

  // Test 4: Google AI API
  console.log('\n4. Google AI API:');
  try {
    if (process.env.GOOGLE_API_KEY) {
      const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
      const llm = new ChatGoogleGenerativeAI({
        model: "gemini-1.5-pro",
        temperature: 0.3,
        apiKey: process.env.GOOGLE_API_KEY,
      });
      
      const response = await llm.invoke([{ content: "Hello, this is a test." }]);
      console.log('   ✅ Google AI API working, response length:', response.content.length);
    } else {
      console.log('   ❌ Google API key missing');
    }
  } catch (error) {
    console.log('   ❌ Google AI API failed:', error.message);
  }

  // Test 5: LangGraph Workflow
  console.log('\n5. LangGraph Workflow:');
  try {
    // This will test if the workflow can be imported and compiled
    const { compiledAuditWorkflow } = require('./lib/workflows/audit-workflow');
    console.log('   ✅ Workflow imported successfully');
    
    // Test basic invocation
    const result = await compiledAuditWorkflow.invoke({
      messages: [],
      current_step: "discovery",
      extracted_data: {},
      opportunities: [],
      roadmap: null,
      painScore: 0,
      sessionId: "test-session"
    });
    
    console.log('   ✅ Workflow execution successful');
    console.log('   📊 Result keys:', Object.keys(result));
  } catch (error) {
    console.log('   ❌ Workflow failed:', error.message);
    console.log('   📋 Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
  }

  console.log('\n🏁 Component testing complete!');
}

testComponents().catch(console.error);