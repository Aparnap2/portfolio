import { FaGithub, FaLinkedin, FaYoutube, FaMedium, FaReddit, FaDiscord } from 'react-icons/fa';
import { SiUpwork } from 'react-icons/si';
import { TbBrandFiverr } from 'react-icons/tb';
import { BsTwitterX } from 'react-icons/bs';

const socialLinks = [
  { name: 'GitHub', url: 'https://github.com/Aparnap2', icon: FaGithub },
  { name: 'LinkedIn', url: 'https://linkedin.com/in/aparnapradhan', icon: FaLinkedin },
  { name: 'Discord', url: 'https://discord.gg/mW5Vgxej', icon: FaDiscord },
  { name: 'Medium', url: 'https://medium.com/@ap3617180', icon: FaMedium },
  { name: 'Reddit', url: 'https://www.reddit.com/user/BatAffectionate7271/', icon: FaReddit },
  { name: 'X (Twitter)', url: 'https://x.com/aparna_dev', icon: BsTwitterX },
  { name: 'Upwork', url: 'https://www.upwork.com/freelancers/~014d5acd58cf68bfa9', icon: SiUpwork },
  { name: 'Fiverr', url: 'https://www.fiverr.com/s/dDzGDA8', icon: TbBrandFiverr },
  { name: 'YouTube', url: 'https://www.youtube.com/@TheEconomicArchitect', icon: FaYoutube },
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
