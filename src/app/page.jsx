'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Github, ExternalLink } from 'lucide-react';
import { Footer } from './component/footer';
import { inter } from './fonts';
import { getTopRepositories } from '../lib/github';
import { useAsync } from '../hooks/useAsync';
import ProjectCard from './component/ProjectCard.tsx';
import Hero from './component/sections/Hero';
import Philosophy from './component/sections/Philosophy';
import Skills from './component/sections/Skills';
import Education from './component/sections/Education';
import Contact from './component/sections/Contact';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const { data: projects, loading: projectsLoading, error } = useAsync(
    useCallback(() => getTopRepositories(6), []),
    [],
    'github-projects'
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      const sections = ['skills', 'philosophy', 'projects', 'education', 'contact'];
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
      { id: 'skills', label: 'Skills' },
      { id: 'philosophy', label: 'Systems' },
      { id: 'projects', label: 'Projects' },
      { id: 'education', label: 'Credentials' },
      { id: 'contact', label: 'Contact' },
    ],
    []
  );

  const isRateLimited = projects?.length === 1 && projects[0]._rateLimited;

  const projectCards = useMemo(() => {
    if (!projects?.length || isRateLimited) return null;
    return projects.slice(0, 8).map((project) => (
      <ProjectCard key={project.id} project={project} />
    ));
  }, [projects, isRateLimited]);

  return (
    <div className={`${inter.className} min-h-screen bg-primary text-text-primary`}>
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
        <Hero />

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

        <section id="projects" className="content-section">
          <div className="container">
            <div className="section-header">
              <div className="section-overline">Portfolio Projects</div>
              <h2 className="section-title">Selected Work</h2>
              <p className="section-subtitle">Agentic AI systems and operations platforms built to demonstrate production-grade engineering</p>
            </div>

            {projectsLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!projectsLoading && projects?.length > 0 && !isRateLimited && (
              <div className="gh-grid">
                {projectCards}
              </div>
            )}

            {!projectsLoading && (error || isRateLimited || !projects || projects.length === 0) && (
              <div style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                <a
                  href="https://github.com/aparnap2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                >
                  <Github size={18} />
                  View All Projects on GitHub
                  <ExternalLink size={16} />
                </a>
              </div>
            )}
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
