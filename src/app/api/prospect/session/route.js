import { getOrCreateSession, getSession, touchSession, generateTokenId } from "../../../../lib/prospect_store.js";

function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-id",
      ...headers,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-id",
    },
  });
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const headerToken = req.headers.get("x-session-id");
    const qpToken = url.searchParams.get("token");
    const tokenId = headerToken || qpToken;

    if (!tokenId) {
      return json(400, { error: "Missing token. Provide x-session-id header or ?token= query param." });
    }

    const session = await getSession(tokenId);
    if (!session) {
      return json(404, { error: "Session not found" });
    }

    // Optional: refresh TTL on read
    await touchSession(tokenId, { ttlDays: 7 });

    return json(200, {
      tokenId,
      session: {
        chat_history: session.chat_history || [],
        topics_discussed: session.topics_discussed || [],
        user_context: session.user_context || {},
        conversation_stage: session.conversation_stage || "initial",
        last_confidence: session.last_confidence ?? null,
        last_intent: session.last_intent ?? null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (err) {
    return json(500, { error: "Internal error", details: String(err?.message || err) });
  }
}

export async function POST(req) {
  try {
    const headerToken = req.headers.get("x-session-id");
    let body = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const {
      tokenId: bodyToken,
      token,
      new_token = false,
      ttlDays = 7,
      session_data = {},
      user_context = {},
    } = body || {};

    const tokenId = new_token ? generateTokenId() : (headerToken || bodyToken || token || undefined);

    const { tokenId: finalToken, session, created } = await getOrCreateSession({
      tokenId,
      session_data,
      user_context,
      ttlDays,
    });

    return json(200, {
      tokenId: finalToken,
      created,
      session: {
        chat_history: session.chat_history || [],
        topics_discussed: session.topics_discussed || [],
        user_context: session.user_context || {},
        conversation_stage: session.conversation_stage || "initial",
        last_confidence: session.last_confidence ?? null,
        last_intent: session.last_intent ?? null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    }, { "x-session-id": finalToken });
  } catch (err) {
    return json(500, { error: "Internal error", details: String(err?.message || err) });
  }
}
