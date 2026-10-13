'use client';

import { useState, useEffect, useMemo } from 'react';
import { Footer } from './component/footer';
import { inter } from './fonts';
import Hero from './component/sections/Hero';
import Philosophy from './component/sections/Philosophy';
import Skills from './component/sections/Skills';
import Education from './component/sections/Education';
import Contact from './component/sections/Contact';
import Flagships from './component/Flagships';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      const sections = ['skills', 'philosophy', 'flagships', 'education', 'contact'];
      const scrollPos = window.scrollY + 100;
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const navItems = useMemo(
    () => [
      { id: 'flagships', label: 'Projects' },
      { id: 'philosophy', label: 'Approach' },
    ],
    []
  );

  const externalNavItems = [
    { id: 'github', label: 'GitHub', href: 'https://github.com/aparnap2' },
    { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com/in/aparnapradhan' },
  ];

  return (
    <div className={`${inter.className} min-h-screen bg-primary text-text-primary`}>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-content">
          <a href="#" className="navbar-logo">
            Aparna<span className="text-accent-primary">.Dev</span>
          </a>

          <nav className="navbar-links">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`navbar-link ${activeSection === item.id ? 'active' : ''}`}
              >
                {item.label}
              </a>
            ))}
            {externalNavItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="navbar-link"
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://linkedin.com/in/aparnapradhan"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
            >
              Connect on LinkedIn
            </a>
          </nav>

          <button
            className="navbar-mobile-menu btn btn-ghost btn-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <nav className="container mobile-menu-content">
            <div className="mobile-menu-links">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="mobile-menu-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {externalNavItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-menu-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <div className="mobile-menu-cta">
              <a
                href="https://linkedin.com/in/aparnapradhan"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connect on LinkedIn
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <Hero />

        <section id="flagships" className="content-section">
          <div className="container">
            <Flagships />
          </div>
        </section>

        <section id="skills" className="content-section">
          <div className="container">
            <Skills />
          </div>
        </section>

        <section id="philosophy" className="content-section">
          <div className="container">
            <Philosophy />
          </div>
        </section>

        <section id="education" className="content-section">
          <div className="container">
            <Education />
          </div>
        </section>

        <Contact />
      </main>

      <Footer />
    </div>
  );
}
