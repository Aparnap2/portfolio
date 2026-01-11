'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Footer } from './component/footer';
import { inter } from './fonts';
import { getTopRepositories } from '../lib/github';
import { useAsync } from '../hooks/useAsync';
import ProjectCard from './component/ProjectCard';
import Hero from './component/sections/Hero';
import Ecosystem from './component/sections/Ecosystem';
import Philosophy from './component/sections/Philosophy';
import Contact from './component/sections/Contact';
import MediumBlogs from './component/sections/MediumBlogs';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // GitHub projects with caching
  const { data: projects, loading: projectsLoading, error } = useAsync(
    useCallback(() => getTopRepositories(6), []),
    [],
    'github-projects'
  );

  // Scroll handler with passive listener
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
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
      { id: 'philosophy', label: 'Philosophy' },
      { id: 'projects', label: 'Projects' },
      { id: 'blogs', label: 'Blogs' },
      { id: 'contact', label: 'Contact' },
    ],
    []
  );

  // Memoized project cards
  const projectCards = useMemo(() => {
    if (!projects?.length) return null;
    return projects.slice(0, 6).map((project) => (
      <ProjectCard key={project.id} project={project} />
    ));
  }, [projects]);

  return (
    <div className={`${inter.className} min-h-screen bg-primary text-primary`}>
      {/* Navigation */}
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container navbar-content">
          <a href="#" className="navbar-logo">
            Aparna<span className="text-accent">.Dev</span>
          </a>

          <nav className="navbar-links">
            {navItems.map((item) =>
              item.dropdown ? (
                <div key={item.id} className="navbar-dropdown">
                  <button className="navbar-link navbar-dropdown-trigger">
                    {item.label}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div className="navbar-dropdown-menu">
                    {item.dropdown.map((subItem) => (
                      <a key={subItem.id} href={`#${subItem.id}`} className="navbar-dropdown-item">
                        {subItem.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a key={item.id} href={`#${item.id}`} className="navbar-link">
                  {item.label}
                </a>
              )
            )}
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
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-subtle bg-secondary">
            <nav className="container py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="navbar-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a href="#contact" className="btn btn-primary mt-2" onClick={() => setMobileMenuOpen(false)}>
                Let&apos;s Talk
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <Hero />

        {/* Production Systems */}
        <section id="systems" className="content-section">
          <div className="container">
            <Ecosystem />
          </div>
        </section>

        {/* Philosophy */}
        <section id="philosophy" className="content-section">
          <div className="container">
            <Philosophy />
          </div>
        </section>

        {/* GitHub Projects */}
        <section id="projects" className="content-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">GitHub Projects</h2>
              <p className="section-subtitle">Open source work and production code</p>
            </div>

            {/* Loading State */}
            {projectsLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-error">{error}</p>
              </div>
            )}

            {/* Projects Grid */}
            {!projectsLoading && !error && projects?.length > 0 && (
              <div className="grid grid-3">
                {projectCards}
              </div>
            )}

            {/* Empty State */}
            {!projectsLoading && !error && (!projects || projects.length === 0) && (
              <div className="text-center py-12">
                <p className="text-tertiary">No projects available</p>
              </div>
            )}
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
