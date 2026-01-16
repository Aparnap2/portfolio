'use client';

import { Github, Linkedin, Mail, ArrowRight } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="section">
      <div className="container">
        <div className="card" style={{ maxWidth: '52rem', margin: '0 auto', textAlign: 'center', padding: '3rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--color-accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <TargetIcon size={28} color="white" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            I don&apos;t build AI features. I build reliable autonomous systems that take responsibility for real work.
          </h2>

          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
            If your team is drowning in operational overhead, I can help you design an AI system that actually removes it.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <a
              href="#systems"
              className="btn btn-primary"
            >
              <ArrowRight size={18} strokeWidth={2} />
              View Case Studies
            </a>

            <a
              href="#philosophy"
              className="btn btn-secondary"
            >
              See System Design
            </a>

            <a
              href="mailto:softservicesinc.portfolio@gmail.com"
              className="btn btn-ghost"
            >
              <Mail size={18} strokeWidth={2} />
              Discuss Engagement
            </a>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border-subtle)' }}>
            <a
              href="https://github.com/aparnap2"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <Github size={16} strokeWidth={2} />
              GitHub
            </a>

            <a
              href="https://linkedin.com/in/aparna-pradhan"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <Linkedin size={16} strokeWidth={2} />
              LinkedIn
            </a>

            <a
              href="mailto:softservicesinc.portfolio@gmail.com"
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
            >
              <Mail size={16} strokeWidth={2} />
              Email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function TargetIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
