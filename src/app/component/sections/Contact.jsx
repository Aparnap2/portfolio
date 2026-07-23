'use client';

import { Github, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

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
            Open to Forward Deployed Engineer & Applied AI roles
          </h2>

          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
            Seeking FDE and Applied AI positions where I can deploy AI systems into production, integrate with complex environments, and deliver measurable business outcomes.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <a
              href="mailto:softservicesinc.portfolio@gmail.com"
              className="btn btn-primary"
            >
              <Mail size={18} strokeWidth={2} />
              Get in Touch
            </a>

            <a
              href="https://linkedin.com/in/aparna-pradhan"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <Linkedin size={18} strokeWidth={2} />
              Connect on LinkedIn
            </a>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border-subtle)', flexWrap: 'wrap' }}>
            <a
              href="tel:+919907552314"
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              <Phone size={16} strokeWidth={2} />
              +91 9907552314
            </a>

            <a
              href="mailto:softservicesinc.portfolio@gmail.com"
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              <Mail size={16} strokeWidth={2} />
              softservicesinc.portfolio@gmail.com
            </a>

            <a
              href="https://github.com/aparnap2"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              <Github size={16} strokeWidth={2} />
              GitHub
            </a>

            <a
              href="https://linkedin.com/in/aparna-pradhan"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              <Linkedin size={16} strokeWidth={2} />
              LinkedIn
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
