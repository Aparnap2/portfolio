import crypto from "crypto";
import { enqueue, QUEUE_NAMES } from "../../../../lib/queue.js";

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hub-Signature-256",
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
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Hub-Signature-256",
    },
  });
}

function verifySignature(rawBody, signature, secret) {
  if (!secret) return true; // allow if no secret configured
  if (!signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (_) {
    return false;
  }
}

export async function POST(req) {
  try {
    const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
    const sig = req.headers.get("x-hub-signature-256") || req.headers.get("X-Hub-Signature-256");
    const event = req.headers.get("x-github-event") || "unknown";
    const delivery = req.headers.get("x-github-delivery") || null;

    const raw = await req.text();
    if (!verifySignature(raw, sig, secret)) {
      return json(401, { error: "Invalid signature" });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch (e) {
      return json(400, { error: "Invalid JSON" });
    }

    const repo = payload?.repository?.full_name || payload?.repo?.full_name || "";
    const head_commit = payload?.head_commit || null;
    const commits = Array.isArray(payload?.commits) ? payload.commits : [];

    const jobPayload = {
      event_type: event,
      delivery_id: delivery,
      repo,
      ref: payload?.ref || null,
      pusher: payload?.pusher?.name || payload?.sender?.login || null,
      head_commit: head_commit ? { id: head_commit.id, message: head_commit.message, url: head_commit.url, timestamp: head_commit.timestamp } : null,
      commits: commits.map(c => ({ id: c.id, message: c.message, url: c.url, timestamp: c.timestamp })),
      createdAt: new Date().toISOString(),
      raw_summary: summarizeEvent(event, payload),
    };

    const dedupeKey = delivery || head_commit?.id || undefined;
    await enqueue(QUEUE_NAMES.githubIngest, jobPayload, {
      type: `github:${event}`,
      dedupeKey,
      priority: Date.now(),
    });

    return json(202, { status: "enqueued", event, delivery: delivery || undefined });
  } catch (err) {
    return json(500, { error: "Internal error", details: String(err?.message || err) });
  }
}

function summarizeEvent(event, payload) {
  try {
    const repo = payload?.repository?.full_name || "unknown";
    if (event === "push") {
      const branch = payload?.ref?.split("/").pop();
      const commits = (payload?.commits || [])
        .map(c => `- ${c.message} (${c.id?.slice(0,7)})`)
        .join("\n");
      return `Push to ${repo}@${branch}\nCommits:\n${commits}`;
    }
    if (event === "create") {
      return `Create ${payload?.ref_type} ${payload?.ref} in ${repo}`;
    }
    if (event === "delete") {
      return `Delete ${payload?.ref_type} ${payload?.ref} in ${repo}`;
    }
    if (event === "release") {
      return `Release ${payload?.release?.name || payload?.release?.tag_name || "unknown"} in ${repo}`;
    }
    return `${event} event for ${repo}`;
  } catch {
    return `${event} event`;
  }
}
