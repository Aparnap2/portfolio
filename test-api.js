// Simple test script to debug the API issue
const { PrismaClient } = require('@prisma/client');
const { Redis } = require('@upstash/redis');

async function testConnections() {
  console.log('Testing database connection...');
  
  try {
    // Test database
    const db = new PrismaClient();
    await db.$connect();
    console.log('✅ Database connection successful');
    await db.$disconnect();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  console.log('\nTesting Redis connection...');
  
  try {
    // Test Redis
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      await redis.set('test', 'hello');
      const result = await redis.get('test');
      console.log('✅ Redis connection successful, test value:', result);
    } else {
      console.log('⚠️ Redis credentials not found, using mock client');
    }
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
  }

  console.log('\nTesting Google AI API...');
  
  try {
    if (process.env.GOOGLE_API_KEY) {
      console.log('✅ Google API key found');
    } else {
      console.log('❌ Google API key not found');
    }
  } catch (error) {
    console.log('❌ Google AI test failed:', error.message);
  }
}

testConnections().catch(console.error);