// src/lib/prospect_store.js
// Purpose: Non-breaking, standalone MongoDB prospect/session store with token-based resume support
// Notes:
// - This file is not imported anywhere yet, so adding it introduces no breaking changes.
// - Uses lazy connection to MongoDB to avoid throwing at import time.
// - Provides reusable utilities for token generation, session create/resume/update, and lead info upsert.

import dotenv from "dotenv";
dotenv.config({ path: ".env" });

import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// We use the official MongoDB Driver for minimal footprint and flexibility
// Dependency required when we wire this module: `npm i mongodb`
let MongoClient;
try {
  // Dynamic import to avoid bundling/throwing when unused
  // eslint-disable-next-line no-undef
  MongoClient = (await import("mongodb")).MongoClient;
} catch (_) {
  // Will be re-attempted on first connect() call
}

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "portfolio_prospects";

// Singleton connection state
let _client = null;
let _db = null;
let _indexesEnsured = false;

// Collection names
const COLLECTIONS = {
  sessions: "prospect_sessions",
};

// Utility: base64url encode
function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// Public: Generate a compact, URL-safe token id
export function generateTokenId(prefix = "prospect_") {
  const rand = crypto.randomBytes(16); // 128 bits
  return `${prefix}${base64url(rand)}`; // e.g., prospect_kT1... (no PII)
}

// Internal: Connect to MongoDB lazily and cache connection
async function connect() {
  if (_db && _client) return { client: _client, db: _db };

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Please configure it in your environment to use prospect_store."
    );
  }

  if (!MongoClient) {
    // Try dynamic import again at runtime
    const mod = await import("mongodb");
    MongoClient = mod.MongoClient;
  }

  _client = new MongoClient(MONGODB_URI, {
    // Reasonable defaults; tune as needed
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  await _client.connect();
  _db = _client.db(MONGODB_DB_NAME);
  await ensureIndexes(_db);
  return { client: _client, db: _db };
}

// Internal: Ensure required indexes exist (idempotent)
async function ensureIndexes(db) {
  if (_indexesEnsured) return;
  const col = db.collection(COLLECTIONS.sessions);

  // Token index (unique)
  await col.createIndex({ tokenId: 1 }, { unique: true, name: "tokenId_unique" });

  // TTL on expiresAt (auto-cleanup)
  // Note: TTL index requires a Date field; documents with null/absent field are not expired
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_ttl" });

  // Optional helpful indexes
  await col.createIndex({ createdAt: 1 }, { name: "createdAt_idx" });
  await col.createIndex({ updatedAt: 1 }, { name: "updatedAt_idx" });

  _indexesEnsured = true;
}

// Helper: Derive default expiry date (e.g., 7 days)
function computeExpiry(ttlDays = 7) {
  const d = new Date();
  d.setDate(d.getDate() + Number(ttlDays || 7));
  return d;
}

// Public: Create a new session with a fresh token
// Returns: { tokenId, session }
export async function createSession({
  tokenId = generateTokenId(),
  session_data = {},
  user_context = {},
  ttlDays = 7,
} = {}) {
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);

  const now = new Date();
  const doc = {
    tokenId,
    session_data: session_data || {},
    chat_history: [],
    topics_discussed: [],
    user_context: user_context || {},
    conversation_stage: "initial",
    last_confidence: null,
    last_intent: null,
    lead: null, // Optional captured lead details
    createdAt: now,
    updatedAt: now,
    expiresAt: computeExpiry(ttlDays),
    events: [], // queue of events for auditing/debugging
    version: 1,
    source: "web",
  };

  await col.insertOne(doc);
  return { tokenId, session: doc };
}

// Public: Get existing session by tokenId (or null)
export async function getSession(tokenId) {
  if (!tokenId || typeof tokenId !== "string") return null;
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);
  return await col.findOne({ tokenId });
}

// Public: Get or create a session
export async function getOrCreateSession({ tokenId, session_data = {}, user_context = {}, ttlDays = 7 } = {}) {
  if (tokenId) {
    const existing = await getSession(tokenId);
    if (existing) return { tokenId, session: existing, created: false };
  }
  const created = await createSession({ tokenId, session_data, user_context, ttlDays });
  return { ...created, created: true };
}

// Public: Update session data (partial set) and/or extend expiry
export async function updateSession(tokenId, { session_data, user_context, extendTTLByDays = 0, topics_discussed, conversation_stage, last_confidence, last_intent } = {}) {
  if (!tokenId) throw new Error("updateSession: tokenId is required");
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);

  const now = new Date();
  const $set = { updatedAt: now };
  if (session_data && typeof session_data === "object") $set["session_data"] = session_data;
  if (user_context && typeof user_context === "object") $set["user_context"] = user_context;
  if (Array.isArray(topics_discussed)) $set["topics_discussed"] = topics_discussed;
  if (typeof conversation_stage === "string") $set["conversation_stage"] = conversation_stage;
  if (typeof last_confidence === "number" || last_confidence === null) $set["last_confidence"] = last_confidence ?? null;
  if (typeof last_intent === "string" || last_intent === null) $set["last_intent"] = last_intent ?? null;

  if (extendTTLByDays && Number(extendTTLByDays) > 0) {
    $set["expiresAt"] = computeExpiry(extendTTLByDays);
  }

  const res = await col.findOneAndUpdate(
    { tokenId },
    { $set },
    { returnDocument: "after" }
  );
  return res?.value || null;
}

// Public: Append chat message to history
export async function appendChatMessage(tokenId, { role, content, metadata = {} } = {}) {
  if (!tokenId) throw new Error("appendChatMessage: tokenId is required");
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);

  const entry = {
    id: uuidv4(),
    role: role || "assistant", // 'user' | 'assistant' | 'system'
    content: typeof content === "string" ? content : JSON.stringify(content),
    metadata: metadata || {},
    ts: new Date(),
  };

  const res = await col.findOneAndUpdate(
    { tokenId },
    { $push: { chat_history: entry }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return res?.value || null;
}

// Public: Record an arbitrary event related to the prospect session
export async function recordEvent(tokenId, { type, payload = {} } = {}) {
  if (!tokenId) throw new Error("recordEvent: tokenId is required");
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);

  const evt = {
    id: uuidv4(),
    type: String(type || "event"),
    payload,
    ts: new Date(),
  };

  const res = await col.findOneAndUpdate(
    { tokenId },
    { $push: { events: evt }, $set: { updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return res?.value || null;
}

// Public: Upsert captured lead info tied to a prospect session
export async function upsertLeadInfo(tokenId, { email, name, company, phone, project_type, budget, timeline, notes } = {}) {
  if (!tokenId) throw new Error("upsertLeadInfo: tokenId is required");
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);

  const now = new Date();
  const lead = {
    email: email || null,
    name: name || null,
    company: company || null,
    phone: phone || null,
    project_type: project_type || null,
    budget: budget || null,
    timeline: timeline || null,
    notes: notes || null,
    updatedAt: now,
  };

  const res = await col.findOneAndUpdate(
    { tokenId },
    { $set: { lead, updatedAt: now } },
    { returnDocument: "after" }
  );
  return res?.value || null;
}

// Public: Extend/refresh TTL without changing content
export async function touchSession(tokenId, { ttlDays = 7 } = {}) {
  if (!tokenId) throw new Error("touchSession: tokenId is required");
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);

  const res = await col.findOneAndUpdate(
    { tokenId },
    { $set: { updatedAt: new Date(), expiresAt: computeExpiry(ttlDays) } },
    { returnDocument: "after" }
  );
  return res?.value || null;
}

// Public: Soft delete (expire immediately)
export async function expireSessionNow(tokenId) {
  if (!tokenId) throw new Error("expireSessionNow: tokenId is required");
  const { db } = await connect();
  const col = db.collection(COLLECTIONS.sessions);

  const res = await col.findOneAndUpdate(
    { tokenId },
    { $set: { expiresAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  return res?.value || null;
}

// Graceful shutdown helper (optional)
export async function closeConnection() {
  try {
    if (_client) await _client.close();
  } catch (_) {
    // no-op
  } finally {
    _client = null;
    _db = null;
    _indexesEnsured = false;
  }
}
