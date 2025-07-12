import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { Redis } from '@upstash/redis';

// Initialize Redis client
// Ensure REDIS_URL and REDIS_TOKEN are set in your environment variables
const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

// Initialize PostgreSQL client configuration
// Ensure DB_HOST, DB_USER, DB_PASS, DB_NAME are set in your environment variables
const pgClientConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // ssl: {
  //   rejectUnauthorized: process.env.NODE_ENV === 'production',
  // }
};

const PROJECTS_CACHE_KEY = process.env.PROJECT_CACHE_KEY || 'project_data:all';
const CACHE_TTL_SECONDS = process.env.CACHE_TTL_SECONDS || 3600; // 1 hour default

export async function GET(request) {
  try {
    // 1. Try to fetch data from cache
    let cachedData = null;
    try {
      cachedData = await redis.get(PROJECTS_CACHE_KEY);
    } catch (redisError) {
      console.error('Redis GET error:', redisError.message);
      // Log the error but proceed to database query as a fallback
    }

    if (cachedData) {
      console.log('Cache hit for projects data.');
      return NextResponse.json(cachedData);
    }

    console.log('Cache miss for projects data. Fetching from database.');

    // 2. If cache miss, fetch from Neon PostgreSQL database
    const pgClient = new Client(pgClientConfig);
    try {
      await pgClient.connect();
      console.log('Connected to Neon DB for fetching projects.');

      const result = await pgClient.query('SELECT * FROM projects ORDER BY updated_at_repo DESC, repo_name ASC');
      const projects = result.rows;
      console.log(`Fetched ${projects.length} projects from Neon DB.`);

      // 3. Store fetched data in cache for future requests
      if (projects && projects.length > 0) {
        try {
          // Using EX to set TTL in seconds
          await redis.set(PROJECTS_CACHE_KEY, JSON.stringify(projects), { ex: parseInt(CACHE_TTL_SECONDS) });
          console.log(`Projects data cached in Redis for ${CACHE_TTL_SECONDS} seconds.`);
        } catch (redisSetError) {
          console.error('Redis SET error:', redisSetError.message);
          // Log the error but still return the data from DB
        }
      }
      return NextResponse.json(projects);
    } catch (dbError) {
      console.error('Database query error:', dbError.message);
      if (dbError.stack) console.error(dbError.stack);
      return NextResponse.json({ error: 'Failed to fetch projects from database', details: dbError.message }, { status: 500 });
    } finally {
      if (pgClient) {
        await pgClient.end();
        console.log('Neon DB connection closed after fetching projects.');
      }
    }
  } catch (error) {
    console.error('Unhandled error in GET /api/projects:', error.message);
    if (error.stack) console.error(error.stack);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}
