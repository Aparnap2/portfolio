'use client';

import { motion } from 'framer-motion';
import { Award, BookOpen, GraduationCap } from 'lucide-react';

const certifications = [
  {
    icon: <Award className="w-5 h-5" />,
    title: "Microsoft Certified: Azure AI Associate / Fundamentals",
    provider: "Microsoft",
    accentColor: '#6366f1'
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Certified AI Agents Developer (HF-2025)",
    provider: "Hugging Face",
    accentColor: '#a855f7'
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "AWS Educate Badge: Introduction to Generative AI",
    provider: "AWS",
    accentColor: '#f59e0b'
  },
  {
    icon: <Award className="w-5 h-5" />,
    title: "Google Cloud Partner Skills Boost",
    provider: "Google Cloud",
    accentColor: '#10b981'
  }
];

const Education = () => {
  return (
    <div className="philosophy-section" id="education">
      <div className="section-header philosophy-header">
        <div className="section-overline">Education & Certifications</div>
        <h2 className="section-title">Continuous Learning</h2>
        <p className="section-subtitle">Self-directed engineering, business analysis, and FP&A design focus areas.</p>
      </div>

      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl)',
        marginBottom: 'var(--space-2xl)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-lg)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-accent-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-accent)',
            flexShrink: 0
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              margin: '0 0 var(--space-xs) 0'
            }}>
              Self-Directed Engineering, Business Analysis & FP&A Design
            </h3>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-tertiary)',
              margin: 0
            }}>
              2023 – Present
            </p>
          </div>
        </div>
        <p style={{
          fontSize: '0.9375rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.7,
          margin: '0 0 var(--space-md) 0'
        }}>
          Focus areas: Distributed Systems, Workflow Orchestration, Solutions Architecture, and Value Engineering
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)'
        }}>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-accent)', margin: '0 0 var(--space-xs) 0' }}>
              Why FP&A for an FDE
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              FDEs translate business pain into technical solutions. FP&A thinking — variance analysis, cost modeling, scenario reforecasting — lets me quantify the problem before building the system. A control tower that catches mismatches before payment blocks is worth more when you can express the dollar impact.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-accent)', margin: '0 0 var(--space-xs) 0' }}>
              Why Business Analysis
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
              BA skills — requirements elicitation, stakeholder mapping, process modeling — turn vague stakeholder asks into structured PRDs and granular task plans. The gap between &quot;we need AI&quot; and a deployed system is a requirements problem, not a model problem.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-lg)'
      }}>
        {certifications.map((cert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-md)',
              transition: 'all var(--transition-base)'
            }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: `${cert.accentColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: cert.accentColor,
              flexShrink: 0
            }}>
              {cert.icon}
            </div>
            <div>
              <h4 style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                margin: '0 0 var(--space-xs) 0',
                lineHeight: 1.4
              }}>
                {cert.title}
              </h4>
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-tertiary)',
                margin: 0
              }}>
                {cert.provider}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Education;
