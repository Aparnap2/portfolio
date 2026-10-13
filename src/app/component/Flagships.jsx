import { useState } from 'react';
import { ArrowUpRight, Github, ShieldCheck } from 'lucide-react';
import claimops from '../../../content/projects/claimops.json';
import finsight from '../../../content/projects/finsight.json';
import HonestLabel from './storybook/HonestLabel';

const ACCENT = '#8b9cff';
const ACCENT_DIM = 'rgba(139, 156, 255, 0.14)';
const LABEL = '#c3ccff';
const GREEN = '#34d399';

const EXPLORERS = {
  finsight: {
    note: 'Flow matches FinSight ADR-001/007/009 at pinned commit 9155cf7. Linked ADRs are canonical.',
    nodes: [
      { label: 'Ingest', sub: 'deterministic', inputs: 'Provider, accounting, settlement and email records.', outputs: 'Normalized statements.', validation: 'Schema + Pydantic Decimal-only boundaries.', failure: 'Malformed input quarantined with a data-gap notice; pipeline does not guess.' },
      { label: 'Validate', sub: '7 stages', inputs: 'Normalized statements.', outputs: 'Validation report.', validation: 'Fiscal consistency, trial balance, evidence presence.', failure: 'Hard fail stops; soft fail degrades and routes upward.' },
      { label: 'Compute', sub: 'Decimal', inputs: 'Validated data.', outputs: 'Variances, materiality, KPIs.', validation: 'Formula-registry oracle tests; exact values.', failure: 'Coverage gap flagged as data gap — never estimated by the model.' },
      { label: 'Assert', sub: 'evidence', inputs: 'Tool results.', outputs: 'Typed assertions + confidence.', validation: 'Confidence floors; at least one non-LLM source.', failure: 'WEAK or INSUFFICIENT assertions trigger a revise loop.' },
      { label: 'Render', sub: 'LLM only', inputs: 'Verified assertions only.', outputs: 'Narrative draft.', validation: 'Post-render claim check on figures and phrases.', failure: 'Hallucinated figure rejected; re-render (max 2) or escalate.' },
      { label: 'Approve', sub: 'human', inputs: 'Validated report + proposed actions.', outputs: 'Authorized execution + audit record.', validation: 'Action taxonomy + autonomy gates.', failure: 'Blocked actions withheld; human must authorize.' },
    ],
  },
  claimops: {
    note: 'Flow matches ClaimOps ADR-001/004/008/009 at pinned commit d1d4937. Linked ADRs are canonical.',
    nodes: [
      { label: 'Intake', sub: 'documents', inputs: 'Claim documents + case metadata.', outputs: 'Tenant-scoped case file.', validation: 'Tenant isolation; idempotency keys.', failure: 'Duplicates deduped; cross-tenant access refused.' },
      { label: 'Parse', sub: 'verified', inputs: 'Documents.', outputs: 'Extraction + OCR confidence.', validation: 'Inclusive IsLow(0.85) gate.', failure: 'Low-confidence documents queue for human review.' },
      { label: 'Investigate', sub: 'read-only AI', inputs: 'Evidence + case state.', outputs: 'Findings + hypotheses.', validation: 'Tool allowlist; denied-tool inventory (T11).', failure: 'Mutation attempt blocked and logged.' },
      { label: 'Review', sub: 'human', inputs: 'Investigation packet.', outputs: 'Reviewer decision.', validation: 'Reviewer authority check.', failure: 'Inconclusive packet returned for more evidence.' },
      { label: 'Decide', sub: 'governed', inputs: 'Reviewed findings.', outputs: 'Finding + immutable audit.', validation: 'Workflow state-machine transitions.', failure: 'Invalid transition rejected.' },
    ],
  },
};

function ExplorerMap({ nodes, selected, project }) {
  const W = 680;
  const H = 132;
  const gap = W / nodes.length;
  const ring = project === 'claimops' ? GREEN : ACCENT;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="explorer-h" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {nodes.map((n, i) => {
        const cx = gap * i + gap / 2;
        const bw = Math.min(150, gap - 26);
        const active = i === selected;
        return (
          <g key={n.label} opacity={active ? 1 : 0.45}>
            {i > 0 && <line x1={gap * i - bw / 2 - 24} y1={H / 2} x2={gap * i - bw / 2 - 4} y2={H / 2} stroke={active ? ring : ACCENT} strokeWidth={active ? 2.5 : 1.5} className="flow-dash" />}
            <rect x={cx - bw / 2} y={H / 2 - 32} width={bw} height={64} rx={10} fill={ACCENT_DIM} stroke={active ? ring : ACCENT} strokeWidth={active ? 2.5 : 1.5} strokeDasharray={n.sub === 'human' ? '6 4' : undefined} />
            <text x={cx} y={H / 2 - 4} textAnchor="middle" fill={LABEL} fontSize={12} fontWeight={active ? 700 : 600}>{n.label}</text>
            <text x={cx} y={H / 2 + 15} textAnchor="middle" fill="#a7aebb" fontSize={11}>{n.sub}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ExplorerMapVertical({ nodes, selected, project }) {
  const W = 220;
  const laneH = 104;
  const H = nodes.length * laneH + 8;
  const ring = project === 'claimops' ? GREEN : ACCENT;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="explorer-v" style={{ width: '100%', height: 'auto', display: 'none' }}>
      {nodes.map((n, i) => {
        const cy = i * laneH + laneH / 2;
        const active = i === selected;
        return (
          <g key={n.label} opacity={active ? 1 : 0.45}>
            {i > 0 && <line x1={W / 2} y1={i * laneH - 26} x2={W / 2} y2={i * laneH - 4} stroke={active ? ring : ACCENT} strokeWidth={active ? 2.5 : 1.5} className="flow-dash" />}
            <rect x={14} y={cy - 32} width={W - 28} height={64} rx={10} fill={ACCENT_DIM} stroke={active ? ring : ACCENT} strokeWidth={active ? 2.5 : 1.5} strokeDasharray={n.sub === 'human' ? '6 4' : undefined} />
            <text x={W / 2} y={cy - 2} textAnchor="middle" fill={LABEL} fontSize={13} fontWeight={active ? 700 : 600}>{n.label}</text>
            <text x={W / 2} y={cy + 17} textAnchor="middle" fill="#a7aebb" fontSize={12}>{n.sub}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Explorer({ project, title }) {
  const data = EXPLORERS[project];
  const [selected, setSelected] = useState(0);
  const node = data.nodes[selected];
  return (
    <section aria-label={`${title} architecture explorer`}>
      <div style={{ marginBottom: '0.9rem' }}>
        <HonestLabel kind="Implemented" note={data.note} />
      </div>
      <div className={`explorer${project === 'claimops' ? ' explorer-mirror' : ''}`}>
        <div className="explorer-map">
          <ExplorerMap nodes={data.nodes} selected={selected} project={project} />
          <ExplorerMapVertical nodes={data.nodes} selected={selected} project={project} />
          <div role="group" aria-label="Workflow stages" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.9rem' }}>
            {data.nodes.map((n, i) => (
              <button
                key={n.label}
                type="button"
                onClick={() => setSelected(i)}
                aria-current={i === selected ? 'true' : undefined}
                className="btn btn-sm pill-btn explorer-node"
                style={{
                  background: i === selected ? ACCENT_DIM : 'var(--color-bg-card)',
                  border: `1px solid ${i === selected ? (project === 'claimops' ? GREEN : ACCENT) : 'var(--color-border-subtle)'}`,
                  color: i === selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                }}
              >
                {i + 1}. {n.label}
              </button>
            ))}
          </div>
        </div>
        <div aria-live="polite" style={{ border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.25rem', background: 'var(--color-bg-card)' }}>
          <h4 style={{ margin: '0 0 0.7rem', fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
            {selected + 1}. {node.label} <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400, fontSize: '0.85rem' }}>· {node.sub}</span>
          </h4>
          {[
            ['Inputs', node.inputs],
            ['Outputs', node.outputs],
            ['Validation rules', node.validation],
            ['Failure path', node.failure],
          ].map(([k, v]) => (
            <p key={k} style={{ margin: '0 0 0.55rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <strong style={{ color: LABEL }}>{k}: </strong>
              <span style={{ color: 'var(--color-text-secondary)' }}>{v}</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.2rem 0.7rem',
  borderRadius: '999px',
  fontSize: '0.72rem',
  fontWeight: 500,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-tertiary)',
};

const linkStyle = {
  color: LABEL,
  fontSize: '0.875rem',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
};

function CaseStudy({ record, project, shortTitle, problem, contributions }) {
  return (
    <article
      id={`flagship-${project}`}
      data-project={project}
      className="flagship-card"
      style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', scrollMarginTop: '5rem' }}
    >
      <div className="section-overline">{record.project}</div>
      <h3 style={{ fontSize: 'clamp(1.3rem, 2.6vw, 1.6rem)', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.01em' }}>
        {shortTitle}
      </h3>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: '0 0 1.5rem', maxWidth: '60ch' }}>
        {problem}
      </p>

      <Explorer project={project} title={record.project} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1.25rem 0' }}>
        <span style={badgeStyle}>
          <ShieldCheck size={13} strokeWidth={2} />
          Implemented
        </span>
        <span style={badgeStyle}>Deterministic tests (config-verified)</span>
        <span style={badgeStyle}>Live-model qualification: in&nbsp;progress</span>
      </div>

      <details className="tech-details">
        <summary>What I built &amp; decided</summary>
        <div className="tech-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: '0 0 0.75rem' }}>{record.tagline}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {contributions.map((c) => (
              <li key={c} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                <span aria-hidden="true" style={{ color: ACCENT }}>▸</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {record.decisions.map((d) => (
              <li key={d.id}>
                <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  {d.id}: {d.title} <ArrowUpRight size={14} strokeWidth={2} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <details className="tech-details">
        <summary>Evidence &amp; limits</summary>
        <div className="tech-body">
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {record.evidence.map((e) => (
              <li key={e.id}>
                <a href={e.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                  {e.type === 'ci' ? 'CI workflow' : 'Evaluation gate'} — {e.maturity === 'Tested' ? 'deterministic gates' : e.verdict}
                  <ArrowUpRight size={14} strokeWidth={2} />
                </a>
              </li>
            ))}
          </ul>
          <ul style={{ padding: '0 0 0 1.1rem', margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
            {record.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-tertiary)', margin: 0, fontFamily: 'var(--font-mono)' }}>
            source {record.sourceRef} · synced {record.syncedAt}
          </p>
        </div>
      </details>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
        <a href={record.repo} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          <Github size={18} strokeWidth={2} />
          Repository
        </a>
        <a href="https://www.linkedin.com/in/aparna-pradhan-06b882215/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          Discuss on LinkedIn
        </a>
      </div>
    </article>
  );
}

export default function Flagships() {
  return (
    <section id="flagships" aria-labelledby="flagships-heading" style={{ scrollMarginTop: '4rem' }}>
      <div className="container">
        <div className="section-header">
          <div className="section-overline">Flagship Projects · Chapters 05–06</div>
          <h2 id="flagships-heading" className="section-title">Two systems, one discipline</h2>
          <p className="section-subtitle">
            Select any workflow stage to inspect its inputs, outputs, validation rules, and failure path.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
          <CaseStudy
            record={finsight}
            project="finsight"
            shortTitle="FinSight — trusted variance narratives"
            problem="FP&A teams need variance commentary they can trust: LLMs hallucinate numbers, purely deterministic systems can't explain them."
            contributions={[
              'Hybrid deterministic + LLM layering: engines compute in Decimal, agents only render language (ADR-001).',
              'Absolute no-math boundary for the LLM, enforced by a CI arithmetic gate (ADR-007).',
              'Seven-stage validation harness with no-skip enforcement and a final circuit breaker (ADR-009).',
              'Hard trust boundary with RAG disabled by default and audit-before-AI ordering (ADR-015).',
            ]}
          />
          <CaseStudy
            record={claimops}
            project="claimops"
            shortTitle="ClaimOps — read-only claim investigation"
            problem="Health-insurance claims need evidence-weighing and exception handling where the AI must never approve, deny, or pay."
            contributions={[
              'Go-authoritative edge backend with Python kept as spec-only artifacts (ADR-001).',
              'Evidence boundary with ports/adapters and doubles for external systems (ADR-004).',
              'Read-only investigation agents with an explicit denied-tool inventory (ADR-008).',
              'OCR-confidence gate routing low-confidence documents to human review (ADR-009).',
            ]}
          />
        </div>
      </div>
    </section>
  );
}
