import { FaGithub, FaLinkedin } from 'react-icons/fa';

const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/Aparnap2', icon: FaGithub },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/aparna-pradhan-06b882215/', icon: FaLinkedin },
];

export const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-xl) 0', marginTop: 'var(--space-3xl)' }}>
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} Aparna Pradhan. Applied AI Architect | Forward Deployed Engineer.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                style={{
                  color: 'var(--color-text-tertiary)',
                  fontSize: '20px',
                  transition: 'color var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <link.icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
