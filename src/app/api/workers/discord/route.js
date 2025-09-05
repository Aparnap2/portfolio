import { dequeueBatch, QUEUE_NAMES, requeue } from "../../../../lib/queue.js";
import { sendLeadNotification, sendSystemAlert } from "../../../../lib/discord.js";

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req) {
  try {
    const batch = await dequeueBatch(QUEUE_NAMES.discordNotification, 10);
    if (batch.length === 0) {
      return json(200, { status: "empty" });
    }

    let processed = 0;
    let failed = 0;

    for (const job of batch) {
      const payload = job?.payload || {};
      try {
        const success = await processDiscordNotification(payload);
        
        if (success) {
          processed++;
        } else {
          throw new Error('Discord notification failed');
        }
      } catch (e) {
        failed++;
        job.attempts = (job.attempts || 0) + 1;
        
        console.error(`Discord notification failed (attempt ${job.attempts}):`, e);
        
        if (job.attempts <= 3) {
          await requeue(QUEUE_NAMES.discordNotification, job);
        } else {
          console.error(`Discord notification permanently failed after ${job.attempts} attempts:`, payload);
        }
      }
    }

    return json(200, { status: "processed", processed, failed });
  } catch (err) {
    return json(500, { error: "Internal error", details: String(err?.message || err) });
  }
}

async function processDiscordNotification(payload) {
  const { type, lead, hubspot_id, error, attempts } = payload;

  try {
    switch (type) {
      case 'new_lead':
        return await sendLeadNotification(lead, 'new_lead');
      
      case 'hubspot_synced':
        return await sendLeadNotification({
          ...lead,
          hubspot_id
        }, 'hubspot_synced');
      
      case 'hubspot_failed':
        return await sendLeadNotification({
          ...lead,
          error,
          attempts
        }, 'hubspot_failed');
      
      case 'capture_failed':
        return await sendSystemAlert({
          type: 'Lead Capture Failed',
          message: `Failed to capture lead: ${error}`,
          severity: 'error',
          details: {
            'Lead Email': lead?.email || 'Unknown',
            'Lead Name': lead?.name || 'Unknown',
            'Error': error,
            'Capture ID': payload.captureId
          }
        });
      
      case 'system_alert':
        return await sendSystemAlert(payload.alert);
      
      default:
        console.warn(`Unknown Discord notification type: ${type}`);
        return false;
    }
  } catch (error) {
    console.error(`Error processing Discord notification type ${type}:`, error);
    return false;
  }
}