'use client';

import { useEffect, useRef, useState } from 'react';
import HonestLabel from './HonestLabel';

// Seeded demo data. Amounts are integer paise; all arithmetic below is
// exact integer math computed locally in the browser. Fictional scenario —
// deliberately distinct from the withheld FS-231 figures.
const P = {
  invoice: { id: 'INV-2041', label: 'Customer invoice', amountPaise: 45000000, ref: 'books' },
  provider: { id: 'PAY-PROV-8891', label: 'Provider payout', amountPaise: 44725000, ref: 'provider statement' },
  bank: { id: 'BANK-CR-5520', label: 'Bank credit', amountPaise: 44725000, ref: 'bank statement' },
  memo: 'Provider memo line 14: “2,750 late-submission fee deducted.”',
  tolerancePaise: 100000, // Rs 1,000
};

const inr = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);

const STAGES = ['Ingest', 'Normalize', 'Reconcile', 'Investigate', 'Validate', 'Approve', 'Execute & audit'];

export default function FinSightWalkthrough() {
  const [stage, setStage] = useState(0);
  const [decision, setDecision] = useState(null); // null | 'approved' | 'rejected'
  const headingRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: false });
  }, [stage]);

  const variance = P.invoice.amountPaise - P.provider.amountPaise;
  const bankMatches = P.bank.amountPaise === P.provider.amountPaise;
  const overTolerance = Math.abs(variance) > P.tolerancePaise;

  const reset = () => {
    setStage(0);
    setDecision(null);
  };

  const goBack = () => {
    setStage((s) => {
      if (s === 6) setDecision(null);
      return Math.max(0, s - 1);
    });
  };

  return (
    <div>
      <div role="note" aria-label="Simulation scope" style={{ border: '1px solid var(--color-border-default)', borderLeft: '3px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '0.7rem 0.9rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', background: 'var(--color-accent-dim)', lineHeight: 1.55 }}>
        <strong style={{ color: 'var(--color-accent-tertiary)' }}>SIMULATED REPLAY — </strong>
        seeded data, integer-paise math computes locally. Nothing books or sends until a person approves; no live ledgers are touched.
      </div>

      <p style={counter} aria-hidden="true">Step {stage + 1} of {STAGES.length}</p>
      <ol style={stepper} aria-label="FinSight walkthrough progress">
        {STAGES.map((s, i) => (
          <li
            key={s}
            aria-current={i === stage ? 'step' : undefined}
            style={{
              ...pill,
              fontWeight: i === stage ? 600 : 400,
              border: `1px solid ${i === stage ? 'var(--color-border-active)' : 'var(--color-border-subtle)'}`,
              color: i <= stage ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              background: i === stage ? 'var(--color-accent-dim)' : 'transparent',
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
            {Object.values({ invoice: P.invoice, provider: P.provider, bank: P.bank }).map((r) => (
              <p key={r.id} style={row}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{r.id}</strong>
                <span style={mono}>{inr(r.amountPaise)}</span>
                <span style={dim}> · {r.label} ({r.ref})</span>
              </p>
            ))}
          </div>
        )}
        {stage === 1 && (
          <div>
            <p style={row}>All amounts converted to <strong style={{ color: 'var(--color-text-primary)' }}>integer paise</strong> — no floats anywhere in the pipeline.</p>
            <p style={row}>Rule R-1: bank credit must equal provider payout exactly.</p>
            <p style={row}>Rule R-2: |invoice − payout| ≤ {inr(P.tolerancePaise)} tolerance, else raise an exception.</p>
          </div>
        )}
        {stage === 2 && (
          <div>
            <p style={row}>Bank vs provider: <Verdict ok>match</Verdict> ({inr(P.bank.amountPaise)}).</p>
            <p style={row}>Invoice vs payout: <Verdict warn>variance {inr(variance)}</Verdict> — exceeds {inr(P.tolerancePaise)} tolerance → exception raised.</p>
            <p style={{ ...row, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>Evidence: {P.memo}</p>
          </div>
        )}
        {stage === 3 && (
          <div>
            <ol style={{ ...listReset, listStyle: 'decimal', paddingLeft: '1.25rem' }}>
              <li style={row}>Correlated invoice, payout, bank credit by case key.</li>
              <li style={row}>Confirmed bank == provider; isolated variance to invoice side.</li>
              <li style={row}>Matched variance to provider memo line 14 (late-submission fee).</li>
            </ol>
            <p style={row}><strong style={{ color: 'var(--color-text-primary)' }}>Proposed explanation:</strong> provider deducted a {inr(variance)} late fee; ledger missing the fee booking. Proposed action: book fee expense + request provider waiver.</p>
          </div>
        )}
        {stage === 4 && (
          <div>
            <Check ok>Arithmetic re-verified in paise: {inr(P.invoice.amountPaise)} − {inr(P.provider.amountPaise)} = {inr(variance)}.</Check>
            <Check ok={bankMatches}>Bank/provider agreement confirmed.</Check>
            <Check ok>Proposed action is inside the approved taxonomy (fee booking + waiver request).</Check>
            <Check ok={false}>Model may not book the entry itself — autonomy gate requires human approval.</Check>
          </div>
        )}
        {stage === 5 && (
          <div>
            <div style={gate}>
              <p style={gateEyebrow}>⬒ HUMAN GATE — REQUIRED</p>
              <p style={row}>Nothing executes until a person decides. This gate cannot be skipped by the workflow.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => { setDecision('approved'); setStage(6); }} className="btn btn-primary btn-sm pill-btn">
                  ✓ Approve fee booking + waiver request
                </button>
                <button
                  type="button"
                  onClick={() => { setDecision('rejected'); setStage(6); }}
                  className="btn btn-sm pill-btn"
                  style={{ background: 'transparent', border: '1px solid var(--color-error-dim)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-full)' }}
                >
                  Reject proposal
                </button>
              </div>
            </div>
          </div>
        )}
        {stage === 6 && (
          <div>
            {decision === 'approved' ? (
              <>
                <p style={row}><strong style={{ color: 'var(--color-success)' }}>Simulation preview:</strong> would book fee expense {inr(variance)} and queue a waiver request to the provider.</p>
                <div style={codeCard} aria-label="Example audit entries, not real writes">
                  <p style={codeNote}>Example audit entries — not real ledger writes:</p>
                  <ol style={{ ...listReset, listStyle: 'none' }}>
                    <li>✓ demo.reconcile.complete variance={variance}paise</li>
                    <li>✓ demo.validate.pass rules=R-1,R-2</li>
                    <li>✓ demo.approval.granted by=demo-reviewer</li>
                    <li>✓ demo.action.book_fee previewed</li>
                    <li>✓ demo.audit.sealed</li>
                  </ol>
                </div>
              </>
            ) : (
              <p style={row}><strong style={{ color: 'var(--color-warning)' }}>Rejected in simulation:</strong> proposal returns to investigation with a reviewer note. No state changed; the rejection is previewed in the audit trail only.</p>
            )}
          </div>
        )}
      </div>

      <div className="demo-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
        <button type="button" onClick={goBack} disabled={stage === 0} className="btn btn-secondary btn-sm pill-btn">
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setStage((s) => Math.min(6, s + 1))}
          disabled={stage >= 6 || stage === 5}
          aria-describedby={stage === 5 ? 'finsight-gate-hint' : undefined}
          className="btn btn-secondary btn-sm pill-btn"
          style={{ cursor: 'pointer' }}
        >
          Next →
        </button>
        <button type="button" onClick={reset} className="btn btn-sm pill-btn" style={{ background: 'transparent', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-full)' }}>
          Reset replay
        </button>
        <HonestLabel kind="Demonstration" note="Seeded fictional scenario with locally computed integer math. Real reconciliation logic lives in FinSight; no live systems are touched." />
      </div>
      {stage === 5 && (
        <p id="finsight-gate-hint" style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0' }}>
          Approval required — choose Approve or Reject above to continue.
        </p>
      )}
    </div>
  );
}

const STAGE_TITLES = [
  'Ingest source records',
  'Normalize + reconciliation rules',
  'Discrepancy + evidence',
  'Investigation trace (recorded pattern)',
  'Deterministic validation + policy',
  'Human approval required',
  'Result + audit preview (simulated)',
];

const h4 = { margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--color-text-primary)' };
const row = { margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 };
const mono = { fontFamily: 'var(--font-mono)', color: 'var(--color-accent-tertiary)' };
const dim = { color: 'var(--color-text-secondary)', fontSize: '0.82rem' };
const listReset = { padding: 0, margin: '0 0 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' };
const counter = { fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: '0 0 0.5rem' };
const stepper = { listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' };
const pill = { fontSize: '0.7rem', padding: '0.28rem 0.55rem', borderRadius: '999px', lineHeight: 1.2, whiteSpace: 'nowrap' };
const eyebrow = { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-secondary)', margin: '0 0 0.25rem' };
const gate = { border: '1px solid rgba(245, 181, 68, 0.4)', background: 'rgba(245, 181, 68, 0.06)', borderRadius: 'var(--radius-md)', padding: '0.9rem 1rem', marginTop: '0.25rem' };
const gateEyebrow = { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-warning)', margin: '0 0 0.5rem' };
const codeCard = { background: 'var(--color-bg-primary)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem 0.9rem', fontFamily: 'var(--font-mono)', fontSize: '0.76rem', lineHeight: 1.7, color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' };
const codeNote = { margin: '0 0 0.4rem', fontSize: '0.72rem', color: 'var(--color-text-secondary)' };

function Verdict({ ok, warn, children }) {
  const label = ok ? 'Pass: ' : 'Warning: ';
  const color = ok ? 'var(--color-success)' : 'var(--color-warning)';
  return (
    <strong style={{ color }}>
      <span className="sr-only">{label}</span>
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
