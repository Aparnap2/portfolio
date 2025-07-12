const { createClient } = require('redis'); // Using 'redis' v4

async function clearCache() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL environment variable is not set.');
    process.exitCode = 1;
    return;
  }

  // Upstash Redis typically uses a URL format like:
  // redis://[password@]host:port or rediss://[password@]host:port
  // The `createClient` from 'redis' v4 can handle this URL directly.
  const client = createClient({
    url: redisUrl,
    // Additional options for Upstash if needed, e.g., TLS for `rediss://`
    // socket: {
    //   tls: redisUrl.startsWith('rediss://'),
    //   rejectUnauthorized: false // Adjust as per your security requirements for Upstash
    // }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
    // Set exit code but don't exit immediately to allow potential cleanup or final log
    process.exitCode = 1;
  });

  try {
    await client.connect();
    console.log('Connected to Redis successfully.');

    // Define the general cache key to be cleared
    const cacheKeyToClear = process.env.PROJECT_CACHE_KEY || 'project_data:all';

    // Using DEL to remove the specific key.
    // If you want to clear ALL keys in the database (like flushAll),
    // ensure that's the intended behavior as it's destructive.
    // For Upstash serverless Redis, flushAll might be disabled or rate-limited.
    // Deleting specific keys is generally safer and more targeted.

    const result = await client.del(cacheKeyToClear);
    if (result > 0) {
      console.log(`Cache key '${cacheKeyToClear}' cleared successfully.`);
    } else {
      console.log(`Cache key '${cacheKeyToClear}' not found or already cleared.`);
    }

    // If you absolutely need to clear everything for this use case:
    // await client.flushDb(); // Clears only the current database
    // console.log('Current Redis database flushed successfully.');
    // Or, if you have multiple DBs and want to clear all of them (less common for Upstash):
    // await client.flushAll();
    // console.log('All Redis databases flushed successfully.');

  } catch (err) {
    console.error('Error during cache clearing operation:', err.message);
    if (err.stack) {
        console.error(err.stack);
    }
    process.exitCode = 1;
  } finally {
    if (client.isOpen) {
      await client.quit();
      console.log('Redis connection closed.');
    } else {
      console.log('Redis client was not open, no need to quit.');
    }
  }
}

clearCache().catch(err => {
  // Catch any unhandled promise rejections from clearCache itself
  console.error('Unhandled error in clearCache:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exitCode = 1;
});
