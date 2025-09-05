#!/usr/bin/env node
// workers/hubspot-worker.js
// Standalone HubSpot sync worker

import dotenv from 'dotenv';
import cron from 'node-cron';
import { dequeueBatch, QUEUE_NAMES, requeue, enqueue } from '../src/lib/queue.js';
import { createLead, updateLead, getLeadByEmail, logLeadEvent, initializeDatabase, closeDatabase } from '../src/lib/database.js';

dotenv.config();

const CONFIG = {
  batchSize: parseInt(process.env.WORKER_BATCH_SIZE) || 10,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
  retryAttempts: parseInt(process.env.WORKER_RETRY_ATTEMPTS) || 3,
  retryDelay: parseInt(process.env.WORKER_RETRY_DELAY) || 5000,
  cronSchedule: process.env.HUBSPOT_WORKER_SCHEDULE || '*/2 * * * *', // Every 2 minutes
  runOnce: process.argv.includes('--once')
};

let isProcessing = false;
let shouldStop = false;

console.log('🚀 HubSpot Worker starting...');
console.log('📋 Configuration:', CONFIG);

async function sendToHubSpot(lead, accessToken) {
  try {
    const {
      email,
      name,
      company,
      phone,
      project_type,
      budget,
      timeline,
      notes,
    } = lead || {};

    if (!email || !name) {
      return { ok: false, error: "missing_required_fields" };
    }

    const [firstname, ...rest] = String(name).trim().split(/\s+/);
    const lastname = rest.join(" ");

    // Base properties
    const properties = {
      email,
      firstname,
      lastname,
      company: company || "",
      phone: phone || "",
      lifecyclestage: "lead",
    };

    // Optional custom property mapping via env variables
    const mapOptional = [
      [process.env.HUBSPOT_PROP_PROJECT_TYPE, project_type],
      [process.env.HUBSPOT_PROP_BUDGET, budget],
      [process.env.HUBSPOT_PROP_TIMELINE, timeline],
      [process.env.HUBSPOT_PROP_NOTES, notes],
    ];

    for (const [prop, value] of mapOptional) {
      if (prop && typeof prop === "string" && value != null && String(value).length > 0) {
        properties[prop] = String(value);
      }
    }

    // Try create; if fails for existing email, try update
    const createRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    if (createRes.ok) {
      const data = await createRes.json();
      return { ok: true, id: data.id };
    }

    // Create failed. Attempt lookup by email and update
    const searchOk = await searchAndUpdateContactByEmail(email, properties, accessToken);
    if (searchOk.ok) return searchOk;

    const errText = await createRes.text();
    return { ok: false, error: errText };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function searchAndUpdateContactByEmail(email, properties, accessToken) {
  try {
    const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              { propertyName: "email", operator: "EQ", value: email },
            ],
          },
        ],
        properties: ["email"],
        limit: 1,
      }),
    });

    if (!searchRes.ok) {
      return { ok: false, error: await searchRes.text() };
    }

    const searchData = await searchRes.json();
    const contact = searchData?.results?.[0];
    if (!contact?.id) {
      return { ok: false, error: "contact_not_found_after_search" };
    }

    const updateRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contact.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    if (!updateRes.ok) {
      return { ok: false, error: await updateRes.text() };
    }

    return { ok: true, id: contact.id };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

async function processHubSpotBatch() {
  if (isProcessing) {
    console.log('⏳ Already processing, skipping...');
    return;
  }

  isProcessing = true;
  const startTime = Date.now();

  try {
    const token = process.env.HUBSPOT_ACCESS_TOKEN || "";
    if (!token) {
      console.error('❌ HUBSPOT_ACCESS_TOKEN not configured');
      return;
    }

    const batch = await dequeueBatch(QUEUE_NAMES.hubspotLead, CONFIG.batchSize);
    if (batch.length === 0) {
      console.log('📭 No jobs in queue');
      return;
    }

    console.log(`📦 Processing batch of ${batch.length} jobs...`);

    let processed = 0;
    let failed = 0;

    for (const job of batch) {
      if (shouldStop) {
        console.log('🛑 Stop signal received, breaking...');
        break;
      }

      const payload = job?.payload || {};
      let leadId = null;

      try {
        // Store/update lead in database
        if (process.env.DATABASE_URL) {
          try {
            const existingLead = await getLeadByEmail(payload.email);
            if (existingLead) {
              leadId = existingLead.id;
              await updateLead(leadId, {
                status: 'syncing'
              });
            } else {
              const newLead = await createLead({
                email: payload.email,
                name: payload.name,
                company: payload.company,
                phone: payload.phone,
                project_type: payload.project_type,
                budget: payload.budget,
                timeline: payload.timeline,
                notes: payload.notes,
                source: 'hubspot_worker',
                status: 'syncing'
              });
              leadId = newLead.id;
            }

            if (leadId) {
              await logLeadEvent(leadId, 'hubspot_sync_started', { job_id: job.id });
            }
          } catch (dbError) {
            console.warn('⚠️ Database operation failed:', dbError.message);
          }
        }

        // Sync to HubSpot
        const result = await sendToHubSpot(payload, token);

        if (result.ok) {
          // Update database with success
          if (leadId) {
            await updateLead(leadId, {
              hubspot_id: result.id,
              hubspot_synced_at: new Date(),
              status: 'synced'
            });
            await logLeadEvent(leadId, 'hubspot_sync_success', { hubspot_id: result.id });
          }

          // Queue Discord notification
          try {
            await enqueue(QUEUE_NAMES.discordNotification, {
              type: 'hubspot_synced',
              lead: payload,
              hubspot_id: result.id
            });
          } catch (discordError) {
            console.warn('⚠️ Failed to queue Discord notification:', discordError.message);
          }

          processed++;
          console.log(`✅ Synced lead ${payload.email} to HubSpot (ID: ${result.id})`);
        } else {
          throw new Error(result.error || "hubspot_sync_failed");
        }
      } catch (error) {
        failed++;
        job.attempts = (job.attempts || 0) + 1;

        console.error(`❌ Failed to sync lead ${payload.email} (attempt ${job.attempts}):`, error.message);

        // Update database with failure
        if (leadId) {
          await updateLead(leadId, {
            status: job.attempts > CONFIG.retryAttempts ? 'sync_failed' : 'sync_retry'
          });
          await logLeadEvent(leadId, 'hubspot_sync_error', {
            error: error.message,
            attempts: job.attempts
          });
        }

        if (job.attempts <= CONFIG.retryAttempts) {
          await requeue(QUEUE_NAMES.hubspotLead, job);
          console.log(`🔄 Requeued job for retry (attempt ${job.attempts}/${CONFIG.retryAttempts})`);
        } else {
          // Queue Discord notification for permanent failure
          try {
            await enqueue(QUEUE_NAMES.discordNotification, {
              type: 'hubspot_failed',
              lead: payload,
              error: error.message,
              attempts: job.attempts
            });
          } catch (discordError) {
            console.warn('⚠️ Failed to queue Discord failure notification:', discordError.message);
          }
          console.error(`💀 Permanently failed to sync lead ${payload.email} after ${job.attempts} attempts`);
        }
      }

      // Add delay between jobs to avoid rate limiting
      if (CONFIG.retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay / 10));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`📊 Batch completed: ${processed} processed, ${failed} failed (${duration}ms)`);

  } catch (error) {
    console.error('❌ Batch processing error:', error);
  } finally {
    isProcessing = false;
  }
}

async function startWorker() {
  try {
    // Initialize database connection
    if (process.env.DATABASE_URL) {
      initializeDatabase();
      console.log('✅ Database initialized');
    }

    if (CONFIG.runOnce) {
      console.log('🔄 Running once...');
      await processHubSpotBatch();
      process.exit(0);
    } else {
      console.log(`⏰ Scheduling worker with cron: ${CONFIG.cronSchedule}`);
      cron.schedule(CONFIG.cronSchedule, processHubSpotBatch);
      console.log('✅ HubSpot worker started and scheduled');
    }

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  shouldStop = true;
  
  // Wait for current processing to finish
  while (isProcessing) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  await closeDatabase();
  console.log('👋 HubSpot worker stopped');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  shouldStop = true;
  
  while (isProcessing) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  await closeDatabase();
  console.log('👋 HubSpot worker stopped');
  process.exit(0);
});

// Start the worker
startWorker();