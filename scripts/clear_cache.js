const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

async function clearCache() {
  await client.connect();
  await client.flushAll();
  console.log('Cache cleared successfully');
  await client.quit();
}

clearCache();
