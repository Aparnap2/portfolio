import { ArrowUpRight, Github, ShieldCheck } from 'lucide-react';
import claimops from '../../../content/projects/claimops.json';
import finsight from '../../../content/projects/finsight.json';

const ACCENT = '#8b9cff';
const ACCENT_DIM = 'rgba(139, 156, 255, 0.14)';
const LABEL = '#c3ccff';

function FlowDiagram({ title, desc, nodes }) {
  const W = 640;
  const H = 120;
  const gap = W / nodes.length;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-labelledby={`${title}-t ${title}-d`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <title id={`${title}-t`}>{title}</title>
      <desc id={`${title}-d`}>{desc}</desc>
      {nodes.map((n, i) => {
        const cx = gap * i + gap / 2;
        const bw = Math.min(150, gap - 28);
        return (
          <g key={n.label}>
            {i > 0 && (
              <line
                x1={gap * i - bw / 2 - 22}
                y1={H / 2}
                x2={gap * i - bw / 2 - 6}
                y2={H / 2}
                stroke={ACCENT}
                strokeWidth="2"
                markerEnd={`url(#${title}-arrow)`}
              />
            )}
            <rect
              x={cx - bw / 2}
              y={H / 2 - 30}
              width={bw}
              height={60}
              rx={10}
              fill={n.boundary ? 'rgba(16, 185, 129, 0.08)' : ACCENT_DIM}
              stroke={n.boundary ? '#10b981' : ACCENT}
              strokeWidth="1.5"
              strokeDasharray={n.human ? '6 4' : undefined}
            />
            <text
              x={cx}
              y={H / 2 - 4}
              textAnchor="middle"
              fill={LABEL}
              fontSize="12"
              fontWeight="600"
            >
              {n.label}
            </text>
            <text
              x={cx}
              y={H / 2 + 14}
              textAnchor="middle"
              fill="#a1a1aa"
              fontSize="10"
            >
              {n.sub}
            </text>
          </g>
        );
      })}
      <defs>
        <marker
          id={`${title}-arrow`}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6" fill="none" stroke={ACCENT} strokeWidth="1.5" />
        </marker>
      </defs>
    </svg>
  );
}

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-bg-elevated)',
  color: 'var(--color-text-secondary)',
};

const linkStyle = {
  color: LABEL,
  fontSize: '0.875rem',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
};

function CaseStudy({ record, problem, contributions, flow, flowTitle, flowDesc }) {
  return (
    <article
      id={`flagship-${record.project === 'FinSight' ? 'finsight' : 'claimops'}`}
      className="flagship-card"
      style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', scrollMarginTop: '5rem' }}
    >
      <div className="section-overline">{record.project}</div>
      <h3 style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 700, margin: '0 0 0.5rem' }}>
        {record.tagline.split('.')[0]}.
      </h3>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: '0 0 1.5rem', maxWidth: '60ch' }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>Problem: </strong>
        {problem}
      </p>

      <div
        style={{
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1.5rem',
          background: 'var(--color-bg-elevated)',
        }}
      >
        <FlowDiagram title={flowTitle} desc={flowDesc} nodes={flow} />
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', margin: '0.5rem 0 0' }}>
          Simplified overview — canonical design lives in the linked ADRs.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <span style={badgeStyle}>
          <ShieldCheck size={14} strokeWidth={2} />
          Implemented
        </span>
        <span style={badgeStyle}>Deterministic tests (config-verified)</span>
        <span style={badgeStyle}>Live-model qualification: in&nbsp;progress</span>
      </div>

      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-tertiary)', margin: '0 0 0.75rem' }}>
        What I built
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {contributions.map((c) => (
          <li key={c} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <span aria-hidden="true" style={{ color: ACCENT }}>▸</span>
            <span>{c}</span>
          </li>
        ))}
      </ul>

      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-tertiary)', margin: '0 0 0.75rem' }}>
        Engineering evidence
      </h4>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {record.decisions.map((d) => (
          <li key={d.id}>
            <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              {d.id}: {d.title} <ArrowUpRight size={14} strokeWidth={2} />
            </a>
          </li>
        ))}
        {record.evidence.map((e) => (
          <li key={e.id}>
            <a href={e.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              {e.type === 'ci' ? 'CI workflow' : 'Evaluation gate'} — {e.maturity === 'Tested' ? 'deterministic gates' : e.verdict}
              <ArrowUpRight size={14} strokeWidth={2} />
            </a>
          </li>
        ))}
      </ul>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <a href={record.repo} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          <Github size={18} strokeWidth={2} />
          Repository
        </a>
        <a href="https://linkedin.com/in/aparna-pradhan" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
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
          <div className="section-overline">Flagship Projects</div>
          <h2 id="flagships-heading" className="section-title">Two systems, one discipline</h2>
          <p className="section-subtitle">
            Bounded AI reasoning inside deterministic, auditable workflows — with human approval where it matters.
          </p>
        </div>
        <div style={{ display: 'grid', gap: 'clamp(1.25rem, 3vw, 2rem)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 26rem), 1fr))' }}>
          <CaseStudy
            record={finsight}
            problem="FP&A teams need variance commentary and forecasts they can trust. LLMs hallucinate numbers; purely deterministic systems can't explain them."
            contributions={[
              'Hybrid deterministic + LLM layering: engines compute in Decimal, agents only render language (ADR-001).',
              'Absolute no-math boundary for the LLM, enforced by a CI arithmetic gate (ADR-007).',
              'Seven-stage validation harness with no-skip enforcement and a final circuit breaker (ADR-009).',
              'Hard trust boundary with RAG disabled by default and audit-before-AI ordering (ADR-015).',
            ]}
            flowTitle="finsight-flow"
            flowDesc="Deterministic engines compute and validate first; the language model only renders narrative from verified assertions; a human approves actions."
            flow={[
              { label: 'Ingest', sub: 'deterministic' },
              { label: 'Validate', sub: '7 stages' },
              { label: 'Compute', sub: 'Decimal' },
              { label: 'Assert', sub: 'evidence' },
              { label: 'Render', sub: 'LLM only' },
              { label: 'Approve', sub: 'human', human: true, boundary: true },
            ]}
          />
          <CaseStudy
            record={claimops}
            problem="Health-insurance claims investigations must weigh evidence and handle exceptions — without ever letting an LLM approve, deny, or pay a claim."
            contributions={[
              'Go-authoritative edge backend with Python kept as spec-only artifacts (ADR-001).',
              'Evidence boundary with ports/adapters and doubles for external systems (ADR-004).',
              'Read-only investigation agents with an explicit denied-tool inventory (ADR-008).',
              'OCR-confidence gate routing low-confidence documents to human review (ADR-009).',
            ]}
            flowTitle="claimops-flow"
            flowDesc="Documents are parsed and verified deterministically; a bounded agent investigates read-only; low-confidence or consequential cases route to human review."
            flow={[
              { label: 'Intake', sub: 'documents' },
              { label: 'Parse', sub: 'verified' },
              { label: 'Investigate', sub: 'read-only AI' },
              { label: 'Review', sub: 'human', human: true, boundary: true },
              { label: 'Decide', sub: 'governed' },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
