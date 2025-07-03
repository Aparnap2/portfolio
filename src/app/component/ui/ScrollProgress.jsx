"use client";
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  // Define major sections to track (memoized to prevent unnecessary re-renders)
  const sections = useMemo(() => [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'services', label: 'Services' },
    { id: 'expertise', label: 'Expertise' },
    { id: 'projects', label: 'Projects' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' }
  ], []);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate overall scroll progress
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);

      // Determine active section
      const viewportHeight = window.innerHeight;
      const viewportMiddle = window.scrollY + (viewportHeight / 3);

      // Find the current section in view
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section) {
          const sectionTop = section.offsetTop;
          if (viewportMiddle >= sectionTop) {
            setActiveSectionIndex(i);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  // Scroll to section smoothly
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block">
      <div className="flex flex-col items-center space-y-3">
        {/* Vertical progress line */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-800 rounded-full z-0">
          <motion.div 
            className="w-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"
            style={{ height: `${scrollProgress}%` }}
          />
        </div>

        {/* Section indicators */}
        {sections.map((section, index) => (
          <motion.button
            key={section.id}
            className="relative z-10 group"
            onClick={() => scrollToSection(section.id)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0.7 }}
            animate={{ 
              opacity: 1,
              scale: index === activeSectionIndex ? 1.2 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            <span className={`block w-3 h-3 rounded-full transition-colors ${index === activeSectionIndex ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' : 'bg-gray-700 group-hover:bg-gray-500'}`} />

            {/* Label that appears on hover */}
            <span className="absolute left-0 transform -translate-x-full -translate-y-1/2 top-1/2 mr-4 px-2 py-1 text-xs text-gray-300 bg-gray-800/90 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {section.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ScrollProgress;
