import { Github, Linkedin } from 'lucide-react';

// Inline SVG icons for platforms not in lucide-react
const DiscordIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 12h-5.5v-1.5c0-1.5-1.5-2.5-3-2.5h-5c-1.5 0-3 1-3 2.5v6c0 1.5 1.5 2.5 3 2.5h5c1.5 0 3-1 3-2.5v-1.5" />
    <path d="M8.5 12H3c-1.5 0-3 1-3 2.5v6c0 1.5 1.5 2.5 3 2.5h5.5" />
    <circle cx="12" cy="7.5" r="1.5" />
    <circle cx="18" cy="12" r="1.5" />
    <circle cx="6" cy="12" r="1.5" />
  </svg>
);

const MediumIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M8 7v10" />
    <path d="M12 7v10" />
    <path d="M16 7v10" />
  </svg>
);

const RedditIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="16" r="2" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <path d="M8 14c1.333 1 4.667 1 6 0" />
  </svg>
);

const UpworkIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 14.5v-4a1 1 0 0 1 1-1h4.5" />
    <path d="M7 13v4a1 1 0 0 1-1 1H3" />
    <path d="M12 17v-4.5a1 1 0 0 1 1-1h5.5" />
    <path d="M17 14v4.5a1 1 0 0 1-1 1h-4.5" />
    <path d="M10 10.5v-2a1 1 0 0 1 1-1h4" />
    <path d="M14 10.5v2a1 1 0 0 1-1 1h-4" />
  </svg>
);

const FiverrIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h4l2-4h5l2 4h4" />
    <path d="M10 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M6 10v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10" />
    <path d="M6 14h12" />
  </svg>
);

const YoutubeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
  </svg>
);

const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/Aparnap2', icon: Github },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/aparnapradhan', icon: Linkedin },
  { name: 'Discord', url: 'https://discord.gg/mW5Vgxej', icon: DiscordIcon },
  { name: 'Medium', url: 'https://medium.com/@ap3617180', icon: MediumIcon },
  { name: 'Reddit', url: 'https://www.reddit.com/user/BatAffectionate7271/', icon: RedditIcon },
  { name: 'Upwork', url: 'https://www.upwork.com/freelancers/~014d5acd58cf68bfa9', icon: UpworkIcon },
  { name: 'Fiverr', url: 'https://www.fiverr.com/s/dDzGDA8', icon: FiverrIcon },
  { name: 'YouTube', url: 'https://www.youtube.com/@TheEconomicArchitect', icon: YoutubeIcon },
];

export const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 'var(--space-xl) 0', marginTop: 'var(--space-3xl)' }}>
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} Aparna Pradhan. Staff+ AI Engineer.
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
                  transition: 'color var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <link.icon size={20} strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
