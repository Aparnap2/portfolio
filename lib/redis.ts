import { Redis } from '@upstash/redis'

let redis: Redis | {
    get: (key: string) => Promise<null>;
    set: (key: string, value: any, opts?: any) => Promise<null>;
};

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.log("Initializing Upstash Redis client...");
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn("Missing Upstash Redis environment variables. Using mock Redis client.");
  // Provide a mock client for build/dev environments without Redis credentials
  redis = {
    async get(key: string): Promise<string | null> {
      console.log(`Mock Redis GET: ${key}`);
      // Return mock data for testing
      if (key === 'session:test-session-id') {
        return JSON.stringify({
          sessionId: 'test-session-id',
          messages: [],
          current_step: 'discovery'
        });
      }
      return null;
    },
    async set(key: string, value: any, opts?: any): Promise<string | null> {
      console.log(`Mock Redis SET: ${key}`, { value, opts });
      return 'OK';
    },
  } as any;
}

export { redis };
