import { dequeueBatch, QUEUE_NAMES, requeue, enqueue } from "../../../../lib/queue.js";
import { upsertLeadInfo, recordEvent } from "../../../../lib/prospect_store.js";
import { createLead, updateLead, getLeadByEmail, logLeadEvent } from "../../../../lib/database.js";

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
    const token = process.env.HUBSPOT_ACCESS_TOKEN || "";
    if (!token) {
      return json(500, { error: "HUBSPOT_ACCESS_TOKEN not configured" });
    }

    const batch = await dequeueBatch(QUEUE_NAMES.hubspotLead, 10);
    if (batch.length === 0) {
      return json(200, { status: "empty" });
    }

    let processed = 0;
    let failed = 0;

    for (const job of batch) {
      const payload = job?.payload || {};
      const tokenId = payload?.tokenId || payload?.token_id || null;
      let leadId = null;
      
      try {
        // Store lead in PostgreSQL database first (if available)
        if (process.env.DATABASE_URL) {
          try {
            const existingLead = await getLeadByEmail(payload.email);
            if (existingLead) {
              leadId = existingLead.id;
              await updateLead(leadId, {
                hubspot_synced_at: null, // Reset sync status for retry
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
                session_id: tokenId,
                status: 'syncing'
              });
              leadId = newLead.id;
            }
            
            if (leadId) {
              await logLeadEvent(leadId, 'hubspot_sync_started', { job_id: job.id });
            }
          } catch (dbError) {
            console.warn('Database operation failed, continuing with HubSpot sync:', dbError);
          }
        }

        // Persist prospect lead data regardless of HubSpot success (backward compatibility)
        if (tokenId) {
          await upsertLeadInfo(tokenId, payload);
          await recordEvent(tokenId, { type: "lead_enqueue", payload });
        }

        const result = await sendToHubSpot(payload, token);

        if (result.ok) {
          // Update database with successful sync
          if (leadId) {
            await updateLead(leadId, {
              hubspot_id: result.id,
              hubspot_synced_at: new Date(),
              status: 'synced'
            });
            await logLeadEvent(leadId, 'hubspot_sync_success', { hubspot_id: result.id });
          }
          
          if (tokenId) {
            await recordEvent(tokenId, { type: "hubspot_success", payload: { id: result.id } });
          }
          
          // Queue Discord notification for successful sync
          try {
            await enqueue(QUEUE_NAMES.discordNotification, {
              type: 'hubspot_synced',
              lead: payload,
              hubspot_id: result.id
            }, { type: 'discord:notification' });
          } catch (discordError) {
            console.warn('Failed to queue Discord notification:', discordError);
          }
          
          processed++;
        } else {
          throw new Error(result.error || "hubspot_failed");
        }
      } catch (e) {
        failed++;
        job.attempts = (job.attempts || 0) + 1;
        
        // Update database with failed sync
        if (leadId) {
          await updateLead(leadId, {
            status: job.attempts > 5 ? 'sync_failed' : 'sync_retry'
          });
          await logLeadEvent(leadId, 'hubspot_sync_error', { 
            error: String(e?.message || e), 
            attempts: job.attempts 
          });
        }
        
        if (tokenId) {
          await recordEvent(tokenId, { type: "hubspot_error", payload: { error: String(e?.message || e), attempts: job.attempts } });
        }
        
        if (job.attempts <= 5) {
          await requeue(QUEUE_NAMES.hubspotLead, job);
        } else {
          // Queue Discord notification for failed sync after max attempts
          try {
            await enqueue(QUEUE_NAMES.discordNotification, {
              type: 'hubspot_failed',
              lead: payload,
              error: String(e?.message || e),
              attempts: job.attempts
            }, { type: 'discord:notification' });
          } catch (discordError) {
            console.warn('Failed to queue Discord failure notification:', discordError);
          }
        }
      }
    }

    return json(200, { status: "processed", processed, failed });
  } catch (err) {
    return json(500, { error: "Internal error", details: String(err?.message || err) });
  }
}

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

    // Optional custom property mapping via env variables to avoid breaking HubSpot account schema
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
