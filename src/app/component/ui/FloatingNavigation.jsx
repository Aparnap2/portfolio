"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHome, FiUser, FiCode, FiBriefcase, FiDollarSign, FiMail } from 'react-icons/fi';

const FloatingNavigation = () => {
  const [activeSection, setActiveSection] = useState('home');

  const navItems = [
    { name: 'Home', href: '#home', icon: <FiHome /> },
    { name: 'About', href: '#about', icon: <FiUser /> },
    { name: 'Services', href: '#services', icon: <FiCode /> },
    { name: 'Projects', href: '#projects', icon: <FiBriefcase /> },
    { name: 'Pricing', href: '#pricing', icon: <FiDollarSign /> },
    { name: 'Contact', href: '#contact', icon: <FiMail /> }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map(item => document.getElementById(item.href.substring(1)));
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (const section of sections) {
        if (section && scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    // Add resize event listener to handle responsive changes
    const handleResize = () => {
      handleScroll();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [navItems]);

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.querySelector(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Mobile horizontal navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <motion.div
          className="flex items-center justify-around p-2 bg-gray-900/70 backdrop-blur-lg border-t border-gray-800/40 shadow-lg"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {navItems.map((item) => (
            <motion.a
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition-colors ${
                activeSection === item.href.substring(1)
                  ? 'text-purple-400 bg-purple-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
              onClick={(e) => scrollToSection(e, item.href)}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-xl sm:text-2xl">{item.icon}</span>
              <span className="text-[8px] sm:text-[10px] font-medium mt-1">{item.name}</span>
            </motion.a>
          ))}
        </motion.div>
      </div>

      {/* Desktop spherical navigation */}
      <div className="fixed right-4 lg:right-8 top-1/2 transform -translate-y-1/2 z-40 hidden md:block">
        <div className="relative flex flex-col items-center space-y-3 lg:space-y-4">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-800/60 rounded-full" />
          {navItems.map((item) => (
            <motion.button
              key={item.name}
              className="relative z-10 group"
              onClick={(e) => scrollToSection(e, item.href)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: activeSection === item.href.substring(1) ? 1.5 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              aria-label={item.name}
            >
              <span
                className={`block w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full transition-colors ${
                  activeSection === item.href.substring(1)
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50'
                    : 'bg-gray-700 group-hover:bg-gray-500'
                }`}
              />
              <span className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 lg:mr-4 px-2 py-1 lg:px-3 lg:py-1.5 text-xs text-gray-200 bg-gray-800/80 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg">
                {item.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </>
  );
};

export default FloatingNavigation;

