'use client';

import { motion } from 'framer-motion';
import { Server, Shield, BarChart3, GitMerge } from 'lucide-react';

const skillCategories = [
  {
    icon: <GitMerge className="w-5 h-5" />,
    title: "Agent Orchestration",
    skills: [
      "Bounded investigation agents",
      "Read-only tool access + denied inventory",
      "Human-in-the-loop gates",
    ],
    accentColor: '#8b9cff',
    evidence: {
      label: 'ClaimOps ADR-008: agent mutation boundary',
      url: 'https://github.com/Aparnap2/Claim_Ops/blob/main/docs/adr/008-agent-mutation-boundary.md',
    },
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Deterministic Validation",
    skills: [
      "Decimal-only financial math",
      "Seven-stage no-skip validation harness",
      "CI arithmetic gate on LLM prompts",
    ],
    accentColor: '#10b981',
    evidence: {
      label: 'FinSight ADR-007 + ADR-009',
      url: 'https://github.com/Aparnap2/Finsight/blob/main/docs/adr/ADR-007-no-llm-calculations.md',
    },
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: "Backend & Data Systems",
    skills: [
      "Go-authoritative services",
      "Postgres-backed workflows",
      "Evidence pipelines with test doubles",
    ],
    accentColor: '#a855f7',
    evidence: {
      label: 'ClaimOps ADR-001 + ADR-004',
      url: 'https://github.com/Aparnap2/Claim_Ops/blob/main/docs/adr/001-go-first-edge.md',
    },
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Testing & Evaluation",
    skills: [
      "Golden datasets + dual metrics",
      "Contract and integration tests",
      "Strict types and lint gates",
    ],
    accentColor: '#06b6d4',
    evidence: {
      label: 'FinSight evaluation + CI workflow',
      url: 'https://github.com/Aparnap2/Finsight/blob/main/.github/workflows/ci.yml',
    },
  }
];

const deliveryStack = [
  "Go", "Python", "PostgreSQL", "Pydantic", "Docker",
  "pytest", "GitHub Actions"
];

const Skills = () => {
  return (
    <div className="philosophy-section" id="skills">
      <div className="section-header philosophy-header">
        <div className="section-overline">Core Skills</div>
        <h2 className="section-title">What I Bring</h2>
        <p className="section-subtitle">Engineering capabilities paired with business analysis foundations for delivering production AI systems.</p>
      </div>

      <div className="philosophy-grid">
        {skillCategories.map((category, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="principle-card"
          >
            <div className="principle-card-header">
              <div
                className="principle-icon"
                style={{
                  background: `${category.accentColor}15`,
                  borderColor: `${category.accentColor}30`,
                  color: category.accentColor,
                }}
              >
                {category.icon}
              </div>
              <h3 className="principle-title">{category.title}</h3>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)'
            }}>
              {category.skills.map((skill, skillIndex) => (
                <li key={skillIndex} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: category.accentColor,
                    flexShrink: 0
                  }} />
                  {skill}
                </li>
              ))}
            </ul>
            <a
              href={category.evidence.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 'var(--space-md)',
                fontSize: '0.8125rem',
                color: '#a5b4fc',
                textDecoration: 'none',
              }}
            >
              Evidence: {category.evidence.label} →
            </a>
          </motion.div>
        ))}
      </div>

      <div className="philosophy-cta">
        <div className="philosophy-cta-content">
          <h3 className="philosophy-cta-title">Delivery Stack</h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
            marginTop: 'var(--space-sm)'
          }}>
            {deliveryStack.map((tech, index) => (
              <span key={index} style={{
                padding: 'var(--space-xs) var(--space-md)',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)'
              }}>
                {tech}
              </span>
            ))}
          </div>
        </div>
        <a href="#contact" className="btn btn-primary btn-lg">
          Let&apos;s Connect
        </a>
      </div>
    </div>
  );
};

export default Skills;
