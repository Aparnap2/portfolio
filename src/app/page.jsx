"use client";
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Footer } from './component/footer';
import { spaceGrotesk } from './fonts';
import { getTopRepositories } from '../lib/github.js';
import { useAsync } from '../hooks/useAsync';
import LazySection from './components/LazySection';
import ProjectCard from './components/ProjectCard';
import Hero from './component/sections/Hero';
import Ecosystem from './component/sections/Ecosystem';
import Architecture from './component/sections/Architecture';
import Philosophy from './component/sections/Philosophy';
import Contact from './component/sections/Contact';

const ChatbotWrapper = dynamic(() => import('./component/chatbot/ChatbotWrapper'), { ssr: false, loading: () => null });
const ModernGridBackground = dynamic(() => import('./component/chatbot/ModernGridBackground'), { ssr: false, loading: () => <div>Loading background...</div> });

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: projects, loading: projectsLoading, error } = useAsync(() => getTopRepositories(6), [], 'github-projects');
  const [expandedReadmes, setExpandedReadmes] = useState({});
  const [readmeCache, setReadmeCache] = useState({});

  const toggleReadme = useCallback(async (projectId) => {
    const isExpanding = !expandedReadmes[projectId];
    setExpandedReadmes(prev => ({ ...prev, [projectId]: isExpanding }));
    
    if (isExpanding && !readmeCache[projectId]) {
      const project = projects?.find(p => p.id === projectId);
      if (project?.name) {
        try {
          const { getReadme } = await import('../lib/github.js');
          const readme = await getReadme(project.name);
          setReadmeCache(prev => ({ ...prev, [projectId]: readme }));
        } catch (error) {
          console.error('Error loading README:', error);
          setReadmeCache(prev => ({ ...prev, [projectId]: 'Error loading README' }));
        }
      }
    }
  }, [expandedReadmes, readmeCache, projects]);

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleResize = () => window.innerWidth >= 768 && setMobileMenuOpen(false);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const Navbar = () => {
    return (
      <>
        <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className={`font-bold text-base sm:text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent ${spaceGrotesk.className}`}>
              Aparna_Pradhan.Dev
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              {['Architecture', 'Projects', 'Contact'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} 
                   className="text-gray-300 hover:text-blue-400 px-3 py-2 text-sm transition-colors">
                  {item}
                </a>
              ))}
              <a href="#contact" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
                Let&apos;s Talk
              </a>
            </div>

            <button className="md:hidden p-2 text-gray-400" onClick={toggleMobileMenu}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 pt-16 bg-black/90 md:hidden" onClick={closeMobileMenu}>
            <div className="bg-gray-900 p-4">
              <div className="flex flex-col space-y-3">
                {['Architecture', 'Projects', 'Contact'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} 
                     className="text-gray-300 py-3 px-4 rounded hover:bg-gray-800 transition-colors" onClick={closeMobileMenu}>
                    {item}
                  </a>
                ))}
                <a href="#contact" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg text-center font-medium" onClick={closeMobileMenu}>
                  Let&apos;s Talk
                </a>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <Navbar />
      
      <div className="pt-16">
        <div className="fixed inset-0 -z-10">
          <ModernGridBackground />
        </div>
        
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-gray-900/70 via-gray-900/30 to-gray-900/70" />

        <Hero />
        <Ecosystem />
        <Architecture />
        <Philosophy />
        
        <LazySection fallback={<div className="h-48 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full"></div></div>}>
          <section id="projects" className="py-16">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">GitHub Projects</h2>
                <p className="text-lg text-gray-400">Top repositories showcasing AI and automation work</p>
              </div>
              {projectsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
                </div>
              )}
              {error && <div className="text-center py-8"><p className="text-red-500 text-sm">{error}</p></div>}
              {projects?.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {projects.slice(0, 6).map((project) => (
                    <ProjectCard key={project.id} project={project} onToggleReadme={toggleReadme} expandedReadmes={expandedReadmes} readmeCache={readmeCache} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No projects available</p>
                </div>
              )}
            </div>
          </section>
        </LazySection>

        <Contact />
        <Footer />
      </div>
      
      {/* Chatbot positioned independently of page content */}
      <ChatbotWrapper />
    </div>
  );
}