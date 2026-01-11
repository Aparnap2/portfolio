import { Github, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-xl) 0', marginTop: 'var(--space-3xl)' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>
          &copy; {new Date().getFullYear()} Aparna Pradhan. Staff+ AI Engineer.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <a href="https://github.com/aparnap2" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-tertiary)', transition: 'color var(--transition-fast)' }}>
            <Github size={20} strokeWidth={2} />
          </a>
          <a href="https://linkedin.com/in/aparna-pradhan" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-tertiary)', transition: 'color var(--transition-fast)' }}>
            <Linkedin size={20} strokeWidth={2} />
          </a>
          <a href="mailto:contact@aparna.dev" style={{ color: 'var(--color-text-tertiary)', transition: 'color var(--transition-fast)' }}>
            <Mail size={20} strokeWidth={2} />
          </a>
        </div>
      </div>
    </footer>
  );
};
