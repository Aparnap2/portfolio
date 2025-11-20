import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const log = {
  info: (...args) => console.log("[TASK_CALLBACK]", ...args),
  warn: (...args) => console.warn("[TASK_CALLBACK]", ...args),
  error: (...args) => console.error("[TASK_CALLBACK]", ...args),
};

export const POST = async (req) => {
  try {
    const taskId = req.headers.get('X-Task-ID') || 'unknown';
    const taskType = req.headers.get('X-Task-Type');

    log.info(`[${taskId}] Task callback received for type: ${taskType}`);

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