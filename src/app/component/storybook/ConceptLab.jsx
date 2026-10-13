'use client';

import { useState } from 'react';
import HonestLabel from './HonestLabel';

const SCENARIOS = {
  clean: {
    name: 'Clean proposal',
    proposal: {
      kind: 'HYPOTHESIS',
      text: 'Revenue variance is driven by delayed enterprise invoicing in March.',
      figures: ['$48,200 variance (pre-computed, assertion #A-117)'],
      citesEvidence: true,
      requestsAction: null,
    },
    checks: [
      { name: 'Type & schema check', pass: true, detail: 'HYPOTHESIS with evidence_ids; confidence 0.81 ≥ 0.70 floor.' },
      { name: 'Evidence check', pass: true, detail: '2 evidence items attached; 1 non-LLM source. No contradictions.' },
      { name: 'Authorization check', pass: true, detail: 'Read-only hypothesis. No action requested.' },
      { name: 'Boundary check', pass: true, detail: 'No arithmetic in proposal; figures reference pre-computed assertions.' },
    ],
    verdict: { tone: 'pass', title: 'ACCEPT — render with citations', detail: 'Passes to commentary rendering. Post-render claim validation re-checks every figure.' },
  },
  unsupported: {
    name: 'Unsupported claim',
    proposal: {
      kind: 'CAUSAL',
      text: 'The variance is primarily caused by supplier fraud.',
      figures: [],
      citesEvidence: false,
      requestsAction: null,
    },
    checks: [
      { name: 'Type & schema check', pass: true, detail: 'Well-formed CAUSAL assertion.' },
      { name: 'Evidence check', pass: false, detail: 'No evidence_ids. No validated driver-tree edge for fraud.' },
      { name: 'Authorization check', pass: true, detail: 'Read-only. No action requested.' },
      { name: 'Boundary check', pass: true, detail: 'No arithmetic attempted.' },
    ],
    verdict: { tone: 'route', title: 'DEGRADE — hypothesis only, flag WEAK', detail: 'Downgraded to HYPOTHESIS with support_level=WEAK. Policy engine routes to human review before rendering as fact.' },
  },
  invalidAction: {
    name: 'Invalid action',
    proposal: {
      kind: 'ACTION',
      text: 'Issue a $12,400 credit note to settle the account.',
      figures: ['$12,400 (model-written, no source assertion)'],
      citesEvidence: true,
      requestsAction: 'issue_credit_note',
    },
    checks: [
      { name: 'Type & schema check', pass: true, detail: 'Well-formed ACTION assertion.' },
      { name: 'Evidence check', pass: true, detail: 'Evidence attached.' },
      { name: 'Authorization check', pass: false, detail: 'issue_credit_note is outside the approved action taxonomy for this autonomy level.' },
      { name: 'Boundary check', pass: false, detail: 'Figure is model-written with no source assertion. Claim validation rejects it.' },
    ],
    verdict: { tone: 'block', title: 'BLOCK — action withheld', detail: 'Added to blocked_actions with reasons. Human must authorize. The model may propose; application code decides.' },
  },
  missing: {
    name: 'Missing evidence',
    proposal: {
      kind: 'NUMERIC',
      text: 'Q2 forecast is $1.9M.',
      figures: ['$1.9M (model-written estimate)'],
      citesEvidence: false,
      requestsAction: null,
    },
    checks: [
      { name: 'Type & schema check', pass: false, detail: 'Monetary field without Decimal source. Pydantic reject_float would refuse it.' },
      { name: 'Evidence check', pass: false, detail: 'No evidence_ids; deterministic projection engine was never consulted.' },
      { name: 'Authorization check', pass: true, detail: 'Read-only. No action requested.' },
      { name: 'Boundary check', pass: false, detail: 'Forecast arithmetic performed by the model instead of finance/scenario_engine/.' },
    ],
    verdict: { tone: 'block', title: 'REJECT — recompute deterministically', detail: 'Pipeline returns a data-gap notice. The scenario engine computes the projection; the model only frames parameters.' },
  },
};

const verdictColor = {
  pass: { border: 'rgba(52, 211, 153, 0.45)', text: '#34d399' },
  route: { border: 'rgba(245, 181, 68, 0.45)', text: '#f5b544' },
  block: { border: 'rgba(239, 68, 68, 0.5)', text: '#f87171' },
};

export default function ConceptLab() {
  const [key, setKey] = useState('clean');
  const [showNotes, setShowNotes] = useState(false);
  const s = SCENARIOS[key];
  const v = verdictColor[s.verdict.tone];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }} role="group" aria-label="Choose a proposal scenario">
        {Object.entries(SCENARIOS).map(([k, sc]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKey(k)}
            aria-pressed={k === key}
            className="btn btn-sm"
            style={{
              background: k === key ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
              border: `1px solid ${k === key ? 'var(--color-border-active)' : 'var(--color-border-subtle)'}`,
              color: k === key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
            }}
          >
            {sc.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))' }}>
        <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: 'var(--color-bg-elevated)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-tertiary)' }}>
            AI layer — interprets, gathers, proposes
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: '0 0 0.5rem' }}>Kind: {s.proposal.kind} · probabilistic</p>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-primary)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>“{s.proposal.text}”</p>
          {s.proposal.figures.map((f) => (
            <p key={f} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#c3ccff', margin: '0 0 0.25rem' }}>{f}</p>
          ))}
          <p style={{ fontSize: '0.8rem', color: s.proposal.citesEvidence ? '#34d399' : '#f5b544', margin: '0.5rem 0 0' }}>
            {s.proposal.citesEvidence ? 'Cites evidence' : 'Cites no evidence'}
            {s.proposal.requestsAction ? ` · requests action: ${s.proposal.requestsAction}` : ' · requests no action'}
          </p>
        </div>

        <div style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', background: 'var(--color-bg-card)' }}>
          <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-tertiary)' }}>
            Control layer — checks, validates, enforces
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {s.checks.map((c) => (
              <li key={c.name} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                <span aria-hidden="true" style={{ color: c.pass ? '#34d399' : '#f87171', fontWeight: 700 }}>
                  {c.pass ? '✓' : '✕'}{' '}
                </span>
                <strong style={{ color: 'var(--color-text-primary)' }}>{c.name}</strong>
                <br />
                <span style={{ color: 'var(--color-text-secondary)' }}>{c.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        aria-live="polite"
        style={{ marginTop: '1rem', border: `1px solid ${v.border}`, borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.02)' }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: v.text }}>{s.verdict.title}</p>
        <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{s.verdict.detail}</p>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          aria-expanded={showNotes}
          className="btn btn-sm"
          style={{ background: 'transparent', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-full)', cursor: 'pointer' }}
        >
          {showNotes ? 'Hide implementation notes' : 'Show implementation notes'}
        </button>
        <HonestLabel kind="Demonstration" note="Local simulation of the AI/control boundary pattern. FinSight ADR-007/009 and ClaimOps ADR-008 describe the real implementations." />
      </div>
      {showNotes && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, borderLeft: '2px solid var(--color-border-emphasis)', paddingLeft: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem' }}>The model may propose. Application code decides whether that proposal satisfies the contract. In the real systems this is: typed assertions with evidence references → deterministic checks (schema, evidence, authorization, boundary) → policy routing (accept, degrade, block) → human approval for consequential actions.</p>
          <p style={{ margin: 0 }}>References: <a style={{ color: '#c3ccff' }} href="https://github.com/Aparnap2/Finsight/blob/main/docs/adr/ADR-007-no-llm-calculations.md" target="_blank" rel="noopener noreferrer">FinSight ADR-007</a>, <a style={{ color: '#c3ccff' }} href="https://github.com/Aparnap2/Finsight/blob/main/docs/adr/ADR-009-validation-harness.md" target="_blank" rel="noopener noreferrer">ADR-009</a>, <a style={{ color: '#c3ccff' }} href="https://github.com/Aparnap2/Claim_Ops/blob/main/docs/adr/008-agent-mutation-boundary.md" target="_blank" rel="noopener noreferrer">ClaimOps ADR-008</a>.</p>
        </div>
      )}
    </div>
  );
}
