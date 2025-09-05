// src/lib/queue.js
// Lightweight Redis-backed queue using Upstash Redis (REST) client already used in the project.
// Non-breaking: this module is additive and not referenced yet.

import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const redis = Redis.fromEnv();

export const QUEUE_NAMES = {
  githubIngest: "queue:github_ingest",
  hubspotLead: "queue:hubspot_lead",
  discordNotification: "queue:discord_notification",
};

// Optional dedupe set per queue
function dedupeSetKey(queueName) {
  return `${queueName}:dedupe`;
}

export async function enqueue(queueName, payload, { id, type, priority, dedupeKey, ttlSeconds } = {}) {
  const job = {
    id: id || uuidv4(),
    type: type || "job",
    priority: typeof priority === "number" ? priority : Date.now(),
    payload,
    enqueuedAt: new Date().toISOString(),
    attempts: 0,
  };

  // Simple dedupe if provided
  if (dedupeKey) {
    const setKey = dedupeSetKey(queueName);
    const added = await redis.sadd(setKey, dedupeKey);
    if (added === 0) {
      return { skipped: true, reason: "duplicate", job };
    }
    if (ttlSeconds && ttlSeconds > 0) await redis.expire(setKey, ttlSeconds);
  }

  // Store as JSON string; we use RPUSH to keep FIFO semantics with LPOP
  await redis.rpush(queueName, JSON.stringify(job));
  if (ttlSeconds && ttlSeconds > 0) await redis.expire(queueName, ttlSeconds);
  return { enqueued: true, job };
}

export async function dequeue(queueName) {
  // LPOP single item
  const raw = await redis.lpop(queueName);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { id: uuidv4(), type: "corrupt", payload: { raw } };
  }
}

export async function dequeueBatch(queueName, max = 5) {
  const items = [];
  for (let i = 0; i < max; i++) {
    const item = await dequeue(queueName);
    if (!item) break;
    items.push(item);
  }
  return items;
}

export async function length(queueName) {
  return await redis.llen(queueName);
}

export async function requeue(queueName, job) {
  // Push back to the tail
  await redis.rpush(queueName, JSON.stringify(job));
}

export async function purge(queueName) {
  await redis.del(queueName);
}
