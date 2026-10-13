'use client';

import { useState } from 'react';
import HonestLabel from './HonestLabel';

const ENTITIES = {
  Invoice: [
    { rel: 'settles against', target: 'Purchase Order', basis: 'line-item match + tolerances' },
    { rel: 'pays down', target: 'Payment', basis: 'allocation records, idempotency keys' },
    { rel: 'must satisfy', target: 'Policy', basis: 'approval thresholds, autonomy level' },
    { rel: 'produces', target: 'Evidence', basis: 'extraction results + confidence scores' },
  ],
  'Purchase Order': [
    { rel: 'authorizes', target: 'Invoice', basis: 'PO number + amount tolerance' },
    { rel: 'constrained by', target: 'Policy', basis: 'budget ownership, approval chain' },
    { rel: 'references', target: 'Evidence', basis: 'approved requisition documents' },
  ],
  Payment: [
    { rel: 'requires', target: 'Action approval', basis: 'human or policy gate before execution' },
    { rel: 'verified by', target: 'Evidence', basis: 'provider record + ledger entry + receipt' },
    { rel: 'audited as', target: 'Audit Trail', basis: 'who, what, when, policy version' },
  ],
  Policy: [
    { rel: 'governs', target: 'Action', basis: 'approved taxonomy + autonomy gates' },
    { rel: 'routes', target: 'Human Review', basis: 'confidence floors, degraded modes' },
  ],
  Evidence: [
    { rel: 'supports', target: 'Assertion', basis: 'evidence_ids + support levels' },
    { rel: 'contradicts →', target: 'Assertion', basis: 'recorded conflicts downgrade support' },
  ],
  Action: [
    { rel: 'needs', target: 'Evidence', basis: 'no evidence, no execution' },
    { rel: 'needs', target: 'Human Review', basis: 'consequential actions never self-authorize' },
    { rel: 'writes', target: 'Audit Trail', basis: 'immutable record of decision + provenance' },
  ],
};

export default function OntologyTracer() {
  const names = Object.keys(ENTITIES);
  const [entity, setEntity] = useState('Invoice');

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }} role="group" aria-label="Choose a business entity">
        {names.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEntity(n)}
            aria-pressed={n === entity}
            className="btn btn-sm pill-btn"
            style={{
              background: n === entity ? 'var(--color-accent-dim)' : 'var(--color-bg-elevated)',
              border: `1px solid ${n === entity ? 'var(--color-border-active)' : 'var(--color-border-subtle)'}`,
              color: n === entity ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }} aria-live="polite">
        {ENTITIES[entity].map((r, i) => (
          <li
            key={`${r.rel}-${r.target}`}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem 0.75rem',
              alignItems: 'baseline',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.7rem 1rem',
              background: 'var(--color-bg-card)',
              fontSize: '0.9rem',
            }}
          >
            <strong style={{ color: 'var(--color-text-primary)' }}>{entity}</strong>
            <span style={{ color: '#8b9cff' }}>{r.rel}</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>{r.target}</strong>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8rem', width: '100%' }}>basis: {r.basis}</span>
          </li>
        ))}
      </ol>
      <div style={{ marginTop: '1rem' }}>
        <HonestLabel kind="Demonstration" note="Illustrative ontology pattern. FinSight's finance domain model (ADR-010) and ClaimOps' evidence model are the implemented variants." />
      </div>
    </div>
  );
}
