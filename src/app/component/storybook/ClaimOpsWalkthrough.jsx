'use client';

import { useEffect, useRef, useState } from 'react';
import HonestLabel from './HonestLabel';

// Seeded fictional claim. The invariant under demonstration: the AI
// investigates and prepares evidence but cannot approve, deny, or pay.
const CLAIM = {
  id: 'CLM-3072',
  claimant: 'Demo Patient (synthetic)',
  documents: [
    { id: 'DOC-1', kind: 'Discharge summary', confidence: 0.93, extraction: 'Admit 2026-08-02 → discharge 2026-08-05; diagnosis coded.', provenance: 'hospital PDF, page 1–3' },
    { id: 'DOC-2', kind: 'Hospital invoice', confidence: 0.88, extraction: 'Billed ₹86,400; line items itemized (8 lines).', provenance: 'hospital PDF, page 4' },
    { id: 'DOC-3', kind: 'Diagnostic report', confidence: 0.71, extraction: 'Partial read: 2 of 5 panels legible; values uncertain.', provenance: 'scan, low resolution' },
  ],
  missing: ['Attending physician statement (required)'],
  gate: 0.85,
};

const STAGES = ['Claim + documents', 'Extraction', 'Gaps', 'Validation', 'Investigation', 'Reviewer packet'];

export default function ClaimOpsWalkthrough() {
  const [stage, setStage] = useState(0);
  const [review, setReview] = useState(null); // null | 'evidence' | 'escalated'
  const headingRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: false });
  }, [stage]);

  const lowConf = CLAIM.documents.filter((d) => d.confidence < CLAIM.gate);

  const reset = () => {
    setStage(0);
    setReview(null);
  };

  return (
    <div>
      <div role="note" aria-label="Read-only guarantee" style={{ border: '1px solid rgba(52, 211, 153, 0.45)', borderLeft: '3px solid var(--color-success)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.9rem', marginBottom: '1.25rem', background: 'rgba(52, 211, 153, 0.06)', lineHeight: 1.55 }}>
        <p style={guaranteeEyebrow}>⬒ READ-ONLY GUARANTEE</p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
          The AI investigates and prepares evidence — it <strong style={{ color: 'var(--color-success)' }}>cannot approve, deny, or pay</strong> this claim.
        </p>
      </div>

      <p style={counter} aria-hidden="true">Step {stage + 1} of {STAGES.length}</p>
      <ol style={stepper} aria-label="ClaimOps walkthrough progress">
        {STAGES.map((s, i) => (
          <li
            key={s}
            aria-current={i === stage ? 'step' : undefined}
            style={{
              ...pill,
              fontWeight: i === stage ? 600 : 400,
              border: `1px solid ${i === stage ? 'rgba(52, 211, 153, 0.55)' : 'var(--color-border-subtle)'}`,
              color: i <= stage ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: i === stage ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
            }}
          >
            {i < stage && <span aria-hidden="true" style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓ </span>}
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      <div aria-live="polite" aria-atomic="true" className="demo-panel">
        <p style={eyebrow} aria-hidden="true">STAGE {stage + 1} / {STAGES.length} · {STAGES[stage].toUpperCase()}</p>
        <h4 ref={headingRef} tabIndex={-1} style={{ ...h4, outline: 'none' }}>{STAGE_TITLES[stage]}</h4>
        {stage === 0 && (
          <div>
            <p style={row}><strong style={{ color: 'var(--color-text-primary)' }}>{CLAIM.id}</strong><span style={dim}> · {CLAIM.claimant}</span></p>
            {CLAIM.documents.map((d) => (
              <p key={d.id} style={row}>{d.id} — {d.kind} <span style={dim}>({d.provenance})</span></p>
            ))}
            <p style={row}>Missing: <Verdict warn>{CLAIM.missing[0]}</Verdict></p>
          </div>
        )}
        {stage === 1 && (
          <div>
            {CLAIM.documents.map((d) => (
              <p key={d.id} style={row}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{d.id}</strong> · confidence{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: d.confidence >= CLAIM.gate ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>{d.confidence.toFixed(2)}</span>
                <br />
                <span style={dim}>{d.extraction}</span>
              </p>
            ))}
          </div>
        )}
        {stage === 2 && (
          <div>
            <p style={row}><WarnIcon /> Below-gate document: {lowConf.map((d) => `${d.id} (${d.confidence.toFixed(2)} < ${CLAIM.gate})`).join(', ')} — routed to human review, never auto-trusted.</p>
            <p style={row}><WarnIcon /> Missing required evidence: {CLAIM.missing[0]} — blocks any finding until supplied.</p>
          </div>
        )}
        {stage === 3 && (
          <div>
            <Check ok={false}>V-1 OCR gate: DOC-3 below 0.85 → excluded from findings.</Check>
            <Check ok={false}>V-2 completeness: required physician statement absent → claim not decidable.</Check>
            <Check ok>V-3 isolation: case scoped to single tenant; idempotency key verified.</Check>
            <p style={{ ...row, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Failures shown are the guardrail working — quarantined, not trusted.</p>
          </div>
        )}
        {stage === 4 && (
          <div>
            <ol style={{ ...listReset, listStyle: 'decimal', paddingLeft: '1.25rem' }}>
              <li style={row}>Assembled trusted evidence: DOC-1, DOC-2 (above gate).</li>
              <li style={row}>Quarantined DOC-3 findings; requested re-scan.</li>
              <li style={row}>Cross-checked invoice lines against discharge dates — consistent.</li>
            </ol>
            <p style={row}><strong style={{ color: 'var(--color-text-primary)' }}>Proposed next steps:</strong> request physician statement; re-scan diagnostics; then route complete packet to reviewer. No decision proposed — the agent has no approve/deny/pay tool.</p>
          </div>
        )}
        {stage === 5 && (
          <div>
            <p style={row}>Packet: trusted evidence (2 docs) + quarantined items (1) + missing list (1) + validation report + investigation notes.</p>
            <p style={{ ...row, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Reviewer demo controls — they preview an outcome; nothing is decided automatically.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button type="button" onClick={() => setReview('evidence')} className="btn btn-primary btn-sm pill-btn">
                Request missing evidence
              </button>
              <button type="button" onClick={() => setReview('escalated')} className="btn btn-secondary btn-sm pill-btn">
                Escalate to senior reviewer
              </button>
            </div>
            {review && (
              <p style={row}>
                <strong style={{ color: 'var(--color-success)' }}>Simulation preview:</strong>{' '}
                {review === 'evidence' ? 'would request evidence from the provider; claim stays open, nothing decided.' : 'would escalate the packet with a full audit preview; claim stays open, nothing decided.'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="demo-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
        <button type="button" onClick={() => setStage((s) => Math.max(0, s - 1))} disabled={stage === 0} className="btn btn-secondary btn-sm pill-btn">
          ← Back
        </button>
        <button type="button" onClick={() => setStage((s) => Math.min(5, s + 1))} disabled={stage >= 5} className="btn btn-secondary btn-sm pill-btn">
          Next →
        </button>
        <button type="button" onClick={reset} className="btn btn-sm pill-btn" style={{ background: 'transparent', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-full)' }}>
          Reset replay
        </button>
        <HonestLabel kind="Demonstration" note="Seeded synthetic claim. Real evidence handling follows ClaimOps ADR-004/008/009; no live claims are touched." />
      </div>
    </div>
  );
}

const STAGE_TITLES = [
  'Claim + document set',
  'Extraction + provenance',
  'Gaps and conflicts',
  'Deterministic validation failures',
  'Read-only AI investigation (recorded pattern)',
  'Reviewer packet + audit preview (simulated)',
];

const h4 = { margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--color-text-primary)' };
const row = { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 };
const dim = { color: 'var(--color-text-secondary)', fontSize: '0.82rem' };
const listReset = { padding: 0, margin: '0 0 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const counter = { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem' };
const stepper = { listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' };
const pill = { fontSize: '0.7rem', padding: '0.28rem 0.55rem', borderRadius: '999px', lineHeight: 1.2, whiteSpace: 'nowrap' };
const eyebrow = { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', margin: '0 0 0.25rem' };
const guaranteeEyebrow = { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-success)', margin: '0 0 0.35rem' };

function WarnIcon() {
  return (
    <span aria-hidden="true" style={{ color: 'var(--color-warning)', fontWeight: 700 }}>⚠ </span>
  );
}

function Verdict({ warn, children }) {
  return (
    <strong style={{ color: 'var(--color-warning)' }}>
      <span className="sr-only">Warning: </span>
      {children}
    </strong>
  );
}

function Check({ ok = true, children, text }) {
  return (
    <p style={row}>
      <span aria-hidden="true" style={{ color: ok ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>{ok ? '✓ ' : '✕ '}</span>
      <span className="sr-only">{ok ? 'Pass: ' : 'Fail: '}</span>
      {children || text}
    </p>
  );
}
