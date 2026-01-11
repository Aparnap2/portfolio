'use client';

import { motion } from 'framer-motion';
import { caseStudies } from '../../data/caseStudies';
import { ArrowRight, ExternalLink, Github, Clock, Target, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

const CaseStudiesSection = () => {
  return (
    <div className="section-header">
      <h2 className="section-title">Case Studies</h2>
      <p className="section-subtitle">
        Production-grade agentic AI systems that solve real business problems.
        Each case study documents the full journey from problem to production.
      </p>

      <div style={{ marginTop: 'var(--space-2xl)' }}>
        {caseStudies.map((study, index) => (
          <motion.div
            key={study.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="card"
            style={{ marginBottom: 'var(--space-xl)' }}
          >
            {/* Header */}
            <div className="p-6 md:p-8" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span
                  className="badge"
                  style={{
                    background: study.status === 'Production'
                      ? 'var(--color-success-dim)'
                      : 'var(--color-warning-dim)',
                    color: study.status === 'Production'
                      ? 'var(--color-success)'
                      : 'var(--color-warning)',
                  }}
                >
                  {study.status}
                </span>
                <span className="text-sm text-tertiary">{study.category}</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-primary mb-2">
                    {study.title}
                  </h3>
                  <p className="text-secondary">{study.tagline}</p>
                </div>

                <div className="flex gap-3">
                  {study.demoUrl && (
                    <a
                      href={study.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  )}
                  {study.githubUrl && (
                    <a
                      href={study.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <Github className="w-4 h-4" />
                      Code
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="p-6 md:p-8">
              <div className="grid grid-3 gap-8">
                {/* Problem - with bold lead-ins */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5" style={{ color: '#f97316' }} />
                    <h4 className="text-lg font-semibold text-primary">Problem</h4>
                  </div>
                  <p className="text-sm problem-description">
                    <span className="problem-lead-in">The Context:</span> {study.problem.context.split('—')[0]}—{' '}
                    <span className="text-secondary">{study.problem.context.split('—')[1]}</span>
                  </p>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <div className="text-xs text-tertiary mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Impact</div>
                    <div className="text-sm text-secondary">{study.problem.userImpact}</div>
                  </div>
                </div>

                {/* Solution */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                    <h4 className="text-lg font-semibold text-primary">Solution</h4>
                  </div>
                  <p className="text-sm text-secondary leading-relaxed mb-3">
                    {study.solution.overview}
                  </p>
                  <div className="space-y-2">
                    {study.solution.workflow.slice(0, 3).map((step) => (
                      <div key={step.step} className="text-sm">
                        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{step.name}:</span>{' '}
                        <span className="text-secondary">{step.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results - KPIs prominently displayed */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5" style={{ color: '#a855f7' }} />
                    <h4 className="text-lg font-semibold text-primary">Results</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {study.results.metrics.slice(0, 4).map((metric) => (
                      <div
                        key={metric.label}
                        style={{
                          background: 'var(--color-bg-elevated)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 'var(--space-md)',
                          borderLeft: '3px solid var(--color-success)',
                        }}
                      >
                        <div className="text-xs text-tertiary mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{metric.label}</div>
                        <div className="kpi-value">{metric.value}</div>
                        <div className="kpi-improvement">{metric.improvement}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tech Stack */}
              <div style={{ marginTop: 'var(--space-xl)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border-subtle)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5" style={{ color: '#06b6d4' }} />
                  <h4 className="text-lg font-semibold text-primary">Tech Stack</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(study.techStack).map(([, techs]) =>
                    techs.map((tech) => (
                      <span
                        key={tech}
                        className="badge"
                      >
                        {tech}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Edge Cases - Full text, no truncation */}
              <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-border-subtle)' }}>
                <h4 className="text-sm font-semibold text-secondary mb-3">
                  Key Edge Cases Handled
                </h4>
                <div className="grid grid-2 gap-3">
                  {study.edgeCases.slice(0, 4).map((edgeCase) => (
                    <div
                      key={edgeCase.issue}
                      style={{
                        background: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-md)',
                      }}
                    >
                      <div className="text-xs text-tertiary mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue</div>
                      <div className="text-sm text-primary mb-2" style={{ fontWeight: 500 }}>{edgeCase.issue}</div>
                      <div className="text-xs text-tertiary mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Handling</div>
                      <div className="text-sm text-secondary">{edgeCase.handling}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                <Link
                  href={`/projects/${study.id}`}
                  className="inline-flex items-center gap-2 font-medium"
                  style={{ color: 'var(--color-accent)' }}
                >
                  View Full Case Study
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CaseStudiesSection;
