'use client';

import { useState, useEffect, useMemo } from 'react';
import { Footer } from './component/footer';
import { inter } from './fonts';
import Hero from './component/sections/Hero';
import FeaturedProjects from './component/sections/FeaturedProjects';
import Philosophy from './component/sections/Philosophy';
import Contact from './component/sections/Contact';
import MediumBlogs from './component/sections/MediumBlogs';
import YouTubeSection from './component/sections/YouTubeSection';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Scroll handler with passive listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      // Scroll spy for active nav state
      const sections = ['projects', 'videos', 'blogs', 'contact'];
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
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Navigation items - consolidated structure
  const navItems = useMemo(
    () => [
      { id: 'projects', label: 'Projects' },
      { id: 'videos', label: 'Videos' },
      { id: 'blogs', label: 'Blogs' },
      { id: 'contact', label: 'Contact' },
    ],
    []
  );

  return (
    <div className={`${inter.className} min-h-screen bg-primary text-primary`}>
      {/* Navigation */}
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-content">
          <a href="#" className="navbar-logo">
            Aparna<span className="text-accent">.Dev</span>
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
            <a
              href="https://discord.gg/mW5Vgxej"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
              aria-label="Join Discord"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 12h-5.5v-1.5c0-1.5-1.5-2.5-3-2.5h-5c-1.5 0-3 1-3 2.5v6c0 1.5 1.5 2.5 3 2.5h5c1.5 0 3-1 3-2.5v-1.5" />
                <path d="M8.5 12H3c-1.5 0-3 1-3 2.5v6c0 1.5 1.5 2.5 3 2.5h5.5" />
                <circle cx="12" cy="7.5" r="1.5" />
                <circle cx="18" cy="12" r="1.5" />
                <circle cx="6" cy="12" r="1.5" />
              </svg>
              Discord
            </a>
            <a href="#contact" className="btn btn-primary btn-sm">
              Let&apos;s Talk
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

        {/* Mobile Menu */}
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
            </div>
            <div className="mobile-menu-cta">
              <a href="#contact" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                Let&apos;s Talk
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <Hero />

        {/* Featured Projects */}
        <section id="projects" className="content-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Featured Projects</h2>
              <p className="section-subtitle">AI agents that solve real business problems</p>
            </div>
            <FeaturedProjects />
          </div>
        </section>

        {/* YouTube Videos */}
        <section id="videos" className="content-section">
          <div className="container">
            <YouTubeSection />
          </div>
        </section>

        {/* Technical Writing */}
        <section id="blogs" className="content-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Technical Writing</h2>
              <p className="section-subtitle">Thoughts on agentic AI systems and production engineering</p>
            </div>
            <MediumBlogs />
          </div>
        </section>

        {/* Contact Section */}
        <Contact />
      </main>

      <Footer />
    </div>
  );
}
