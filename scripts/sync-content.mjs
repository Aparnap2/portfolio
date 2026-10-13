// Build-time GitHub ingestion for the portfolio content model.
//
// Reads content/sources.json (publication allowlist: 2 repos, explicit
// file paths only), fetches each file from raw.githubusercontent.com,
// validates structure, merges curated editorial from content/overlay.json,
// and writes content/projects/*.json.
//
// Failure policy: any fetch/validation failure for a project keeps that
// project's last-good file untouched and logs a warning; the build
// continues. Set STRICT_SYNC=1 to exit non-zero instead (manual runs).
// Env override for testing: GITHUB_RAW_BASE (default https://raw.githubusercontent.com).
// No credentials are used or required. Nothing is published automatically.

import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_BASE = process.env.GITHUB_RAW_BASE || 'https://raw.githubusercontent.com';
const STRICT = process.env.STRICT_SYNC === '1';
const FETCH_TIMEOUT_MS = 15000;
const MIN_BODY_CHARS = 200;

const SECRET_PATTERNS = [
  /BEGIN [A-Z ]*PRIVATE KEY/,
  /sk-live-[A-Za-z0-9]+/,
  /AKIA[0-9A-Z]{16}/,
  /xox[bap]-/,
];

const failures = [];
const warnings = [];

function warn(msg) {
  warnings.push(msg);
  console.warn(`[sync-content] WARN: ${msg}`);
}

function fail(msg) {
  failures.push(msg);
  console.error(`[sync-content] FAIL: ${msg}`);
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'portfolio-content-sync', Accept: 'text/plain' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.length < MIN_BODY_CHARS) throw new Error(`body too short (${text.length} chars)`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function scanSecrets(id, text) {
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`refused: secret-like pattern ${pattern} in ${id}`);
    }
  }
}

function extractTitle(text) {
  const match = text.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function extractStatus(text) {
  const match = text.match(/^[*-]?\s*\*{0,2}Status:\*{0,2}\s*(.+)$/m);
  if (!match) return null;
  return match[1].replace(/\*/g, '').trim();
}

function blobUrl(repo, ref, path) {
  return `https://github.com/${repo}/blob/${ref}/${path}`;
}

function buildDecision(entry, text, editorial, repo, ref) {
  scanSecrets(entry.id, text);
  const title = extractTitle(text);
  if (!title) throw new Error(`${entry.id}: no Markdown H1 title found`);
  const decision = {
    id: entry.id,
    title,
    sourcePath: entry.path,
    sourceUrl: blobUrl(repo, ref, entry.path),
  };
  if (entry.kind === 'adr') {
    const status = extractStatus(text);
    if (!status) throw new Error(`${entry.id}: no Status line found`);
    decision.status = status;
  } else {
    decision.status = 'current source on main';
  }
  const ed = (editorial.decisions && editorial.decisions[entry.id]) || null;
  if (!ed) {
    warn(`${entry.id}: no editorial overlay entry; defaulting maturity to "In progress"`);
    decision.maturity = 'In progress';
    decision.summary = 'Awaiting curated summary.';
    decision.limits = 'Not yet reviewed for publication.';
  } else {
    decision.maturity = ed.maturity;
    decision.summary = ed.summary;
    decision.limits = ed.limits;
  }
  return decision;
}

async function buildProject(key, manifest, overlay) {
  const { repo, ref, files } = manifest;
  const decisions = [];
  for (const entry of files) {
    if (entry.kind !== 'adr' && entry.kind !== 'doc') continue;
    const url = `${RAW_BASE}/${repo}/${ref}/${entry.path}`;
    const text = await fetchText(url);
    decisions.push(buildDecision(entry, text, overlay, repo, ref));
  }
  // Evidence entries reference workflow files: verify each still exists upstream.
  const evidence = [];
  for (const [id, ed] of Object.entries(overlay.evidence || {})) {
    const manifestEntry = files.find((f) => f.id === id);
    if (manifestEntry) {
      const url = `${RAW_BASE}/${repo}/${ref}/${manifestEntry.path}`;
      await fetchText(url); // throws on failure; content itself stays curated
    } else {
      warn(`${key}/${id}: evidence has no manifest file entry; skipping upstream check`);
    }
    evidence.push({ id, ...ed });
  }
  const syncedAt = new Date().toISOString().slice(0, 10);
  const record = {
    project: overlay.project,
    repo: overlay.repo,
    tagline: overlay.tagline,
    sourceRef: `${ref}`,
    syncedAt,
    verifiedBy: 'build-time GitHub ingestion (allowlisted paths only) + curated overlay',
    decisions,
    evidence,
    limitations: overlay.limitations,
  };
  if (overlay.historicalNote) record.historicalNote = overlay.historicalNote;
  return record;
}

async function main() {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'content', 'sources.json'), 'utf8'));
  const overlays = JSON.parse(readFileSync(join(ROOT, 'content', 'overlay.json'), 'utf8'));
  let wrote = 0;
  for (const [key, entry] of Object.entries(manifest)) {
    const overlay = overlays[key];
    if (!overlay) {
      fail(`${key}: no overlay entry; skipping`);
      continue;
    }
    try {
      const record = await buildProject(key, entry, overlay);
      const outPath = join(ROOT, 'content', 'projects', `${key}.json`);
      const tmpPath = `${outPath}.tmp`;
      writeFileSync(tmpPath, `${JSON.stringify(record, null, 2)}\n`);
      renameSync(tmpPath, outPath);
      wrote += 1;
      console.log(`[sync-content] wrote ${key}.json (${record.decisions.length} decisions, ${record.evidence.length} evidence)`);
    } catch (err) {
      fail(`${key}: ${err.message}; kept last-good file`);
    }
  }
  console.log(`[sync-content] done: ${wrote} project(s) refreshed, ${failures.length} failure(s), ${warnings.length} warning(s)`);
  if (STRICT && failures.length > 0) process.exit(1);
}

await main();
