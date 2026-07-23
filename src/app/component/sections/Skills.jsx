'use client';

import { motion } from 'framer-motion';
import { Code, Layers, Settings, Shield, BarChart3, Server, Database, GitMerge } from 'lucide-react';

const skillCategories = [
  {
    icon: <GitMerge className="w-5 h-5" />,
    title: "Engineering & Design",
    skills: [
      "Forward Deployed Engineering",
      "Solution Design",
      "Agentic AI Systems",
      "Workflow Orchestration"
    ],
    accentColor: '#6366f1'
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: "Development Stack",
    skills: [
      "Go 1.24 (Fiber, gRPC)",
      "Python (FastAPI, AsyncIO, Pydantic)",
      "LangGraph",
      "PostgreSQL, Redis, Qdrant"
    ],
    accentColor: '#10b981'
  },
  {
    icon: <Settings className="w-5 h-5" />,
    title: "Methodology & Ops",
    skills: [
      "PRD Slicing",
      "Task Decomposition",
      "TDD",
      "Docker, Curl-based Smoke Tests",
      "Governance Gates"
    ],
    accentColor: '#a855f7'
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Reliability & Business",
    skills: [
      "Deterministic Logic",
      "Audit Trails",
      "HITL Review",
      "Langfuse Observability",
      "FP&A Variance Thinking"
    ],
    accentColor: '#06b6d4'
  }
];

const deliveryStack = [
  "Go 1.24", "Python", "LangGraph", "FastAPI", "PostgreSQL",
  "Redis", "Qdrant", "Docker", "Langfuse", "OpenTelemetry", "TDD"
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
