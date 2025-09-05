import { dequeueBatch, QUEUE_NAMES, requeue } from "../../../../lib/queue.js";
import { processAndEmbed } from "../../../../lib/data_processor.js";
import { getEmbeddingsCollection } from "../../../../lib/astradb.js";

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
    const batch = await dequeueBatch(QUEUE_NAMES.githubIngest, 5);
    if (batch.length === 0) {
      return json(200, { status: "empty" });
    }

    const coll = await getEmbeddingsCollection();

    let processed = 0;
    let failed = 0;

    for (const job of batch) {
      try {
        const { payload, type, id } = job;
        const text = buildTextFromPayload(payload);
        const source = `github:${payload.repo || "unknown"}`;
        const meta = {
          event_type: payload.event_type,
          repo: payload.repo,
          ref: payload.ref,
          pusher: payload.pusher,
          created_at: payload.createdAt,
          source_type: "github_event",
          last_updated: new Date().toISOString(),
          raw_summary: payload.raw_summary,
        };

        const docs = await processAndEmbed(text, source, meta);
        if (docs.length === 0) {
          // Nothing to upsert, skip
          processed++;
          continue;
        }

        // Upsert/insert chunks into AstraDB
        for (const d of docs) {
          const doc = {
            pageContent: d.pageContent,
            metadata: d.metadata,
          };
          try {
            await coll.insertOne(doc);
          } catch (e) {
            // If insertOne fails due to duplicate, you can switch to updateOne with an appropriate filter.
          }
        }

        processed++;
      } catch (e) {
        failed++;
        // Basic retry: increment attempts and requeue up to 3
        job.attempts = (job.attempts || 0) + 1;
        if (job.attempts <= 3) {
          await requeue(QUEUE_NAMES.githubIngest, job);
        }
      }
    }

    return json(200, { status: "processed", processed, failed });
  } catch (err) {
    return json(500, { error: "Internal error", details: String(err?.message || err) });
  }
}

function buildTextFromPayload(payload) {
  try {
    const lines = [];
    lines.push(`# Repo: ${payload.repo || "unknown"}`);
    lines.push(`Event: ${payload.event_type}`);
    if (payload.ref) lines.push(`Ref: ${payload.ref}`);
    if (payload.pusher) lines.push(`Pusher: ${payload.pusher}`);
    if (Array.isArray(payload.commits) && payload.commits.length) {
      lines.push("Commits:");
      for (const c of payload.commits) {
        lines.push(`- ${c.message} (${(c.id || "").slice(0,7)}) at ${c.timestamp}`);
      }
    }
    if (payload.head_commit) {
      lines.push("Head Commit:");
      lines.push(`- ${payload.head_commit.message} (${(payload.head_commit.id || "").slice(0,7)}) at ${payload.head_commit.timestamp}`);
    }
    if (payload.raw_summary) {
      lines.push("\nSummary:");
      lines.push(payload.raw_summary);
    }
    return lines.join("\n");
  } catch {
    return JSON.stringify(payload);
  }
}
