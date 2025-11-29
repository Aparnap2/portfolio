import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = Redis.fromEnv();

const log = {
  info: (...args) => console.log("[TASK_CALLBACK]", ...args),
  warn: (...args) => console.warn("[TASK_CALLBACK]", ...args),
  error: (...args) => console.error("[TASK_CALLBACK]", ...args),
};

// Optional QStash signature verification
async function verifyQStashSignature(req) {
  const currentSignKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSignKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  
  if (!currentSignKey && !nextSignKey) {
    log.warn("No QStash signing keys configured, skipping signature verification");
    return true; // Allow request if no verification keys configured
  }

  const signature = req.headers.get('Upstash-Signature');
  if (!signature) {
    log.error("Missing Upstash-Signature header");
    return false;
  }

  try {
    const body = await req.clone().text();
    const timestamp = req.headers.get('Upstash-Timestamp');
    
    // Try current signing key first, then next signing key
    const keysToTry = [currentSignKey, nextSignKey].filter(Boolean);
    
    for (const signingKey of keysToTry) {
      const computedSignature = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp + body)
        .digest('hex');

      if (signature === computedSignature) {
        log.info("QStash signature verified successfully");
        // Restore the original body for further processing
        req.body = body;
        return true;
      }
    }

    log.error("QStash signature verification failed");
    return false;
  } catch (error) {
    log.error("QStash signature verification error:", error);
    return false;
  }
}

export const POST = async (req) => {
  try {
    const taskId = req.headers.get('X-Task-ID') || 'unknown';
    const taskType = req.headers.get('X-Task-Type');

    log.info(`[${taskId}] Task callback received for type: ${taskType}`);

    // Optional signature verification
    if (process.env.QSTASH_CURRENT_SIGNING_KEY || process.env.QSTASH_NEXT_SIGNING_KEY) {
      const isVerified = await verifyQStashSignature(req);
      if (!isVerified) {
        log.error(`[${taskId}] QStash signature verification failed`);
        return new Response('Unauthorized: Invalid signature', { status: 401 });
      }
    }

    if (!req.body) {
      log.error(`[${taskId}] No request body received`);
      return new Response('Missing request body', { status: 400 });
    }

    const callbackData = await req.json();

    // Update task status based on callback
    const taskKey = `task:${taskId}`;
    const existingTask = await redis.get(taskKey);

    if (existingTask) {
      const taskData = JSON.parse(existingTask);
      const updatedTask = {
        ...taskData,
        status: callbackData.success ? 'completed' : 'failed',
        processedAt: new Date().toISOString(),
        callbackData: callbackData
      };

      await redis.setex(taskKey, 60 * 60, JSON.stringify(updatedTask));
      log.info(`[${taskId}] Task status updated to: ${updatedTask.status}`);
    } else {
      log.warn(`[${taskId}] Task not found in Redis, creating new record`);
      const taskData = {
        id: taskId,
        type: taskType,
        status: callbackData.success ? 'completed' : 'failed',
        processedAt: new Date().toISOString(),
        callbackData: callbackData
      };
      await redis.setex(taskKey, 60 * 60, JSON.stringify(taskData));
    }

    return new Response(JSON.stringify({
      success: true,
      taskId,
      processed: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    log.error('Task callback processing failed:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET = async (req) => {
  // Health check endpoint
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'task-callback',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};