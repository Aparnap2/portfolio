"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiServer, FiDatabase } from 'react-icons/fi';
import { FaRobot, FaBrain, FaMobileAlt } from 'react-icons/fa';
import me from './public/images/me.jpeg';
import { Footer } from './component/footer';
import ModernGridBackground from './component/chatbot/ModernGridBackground';
import { projects } from './projects';
import dynamic from 'next/dynamic';
import { ProjectCard } from './component/ProjectCard';
import { firaCode, spaceGrotesk } from './fonts';

// Section Title Component
const SectionTitle = ({ title, subtitle, className = '' }) => (
  <div className={`text-center mb-12 ${className}`}>
    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
      {title}
    </h2>
    {subtitle && (
      <p className="text-lg text-gray-400 max-w-3xl mx-auto">
        {subtitle}
      </p>
    )}
  </div>
);

// Loading Animation Component
const LoadingAnimation = () => (
  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
    <motion.div
      className="w-20 h-20 relative mb-4"
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="w-5 h-5 bg-orange-400 rounded-full absolute"
          style={{
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
          }}
          animate={{
            x: [0, 40, 0, -40, 0],
            y: [0, 40, 0, -40, 0],
            opacity: [0.2, 0.8, 1, 0.8, 0.2],
          }}
          transition={{
            duration: 2,
            delay: i * 0.2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
    <motion.p 
      className="text-orange-400 font-medium mt-4"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    >
      Loading Portfolio...
    </motion.p>
  </div>
);

// Utility section
const Section = ({ id, title, children }) => (
  <section id={id} className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
    <SectionTitle title={title} />
    {children}
  </section>
);

// Platform Logos
const FiverrLogo = ({ className = '' }) => (
  <svg className={`inline-block mr-2 ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.5 15.5C19.5 17.16 18.16 18.5 16.5 18.5C14.84 18.5 13.5 17.16 13.5 15.5C13.5 13.84 14.84 12.5 16.5 12.5C18.16 12.5 19.5 13.84 19.5 15.5Z" fill="#1DBF73"/>
    <path d="M10.5 15.5C10.5 17.16 9.16 18.5 7.5 18.5C5.84 18.5 4.5 17.16 4.5 15.5C4.5 13.84 5.84 12.5 7.5 12.5C9.16 12.5 10.5 13.84 10.5 15.5Z" fill="#1DBF73"/>
    <path d="M15 8.5C15 10.16 13.66 11.5 12 11.5C10.34 11.5 9 10.16 9 8.5C9 6.84 10.34 5.5 12 5.5C13.66 5.5 15 6.84 15 8.5Z" fill="#1DBF73"/>
  </svg>
);

const UpworkLogo = ({ className = '' }) => (
  <svg className={`inline-block mr-2 ${className}`} width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24.75 17.6429C24.75 17.6429 26.7 17.5571 27.2 17.5571C26.7 17.9 26.2 18.3286 25.7 18.7571C23.3 20.7 18.55 24.5 18.55 24.5L15.5 16.2L18.8 7.5H24.05L22.5 12.5H28L29.5 7.5H32L28.7 16.2L31.5 21.5H28.95L24.75 17.6429Z" fill="#14A800"/>
    <path d="M12.55 24.5L9.5 16.2L12.8 7.5H18.05L16.5 12.5H22L23.5 7.5H25.8L22.5 16.2L25.8 24.5H20.5L18.55 17.6L16.5 24.5H12.55Z" fill="#14A800"/>
    <path d="M8.5 7.5L4 24.5H0L4.5 7.5H8.5Z" fill="#14A800"/>
  </svg>
);

// Platform Section Headers
const PlatformSection = ({ id, title, isFiverr = false, isUpwork = false, children }) => {
  const gradient = isFiverr 
    ? 'bg-gradient-to-r from-green-500 to-green-600' 
    : isUpwork 
      ? 'bg-gradient-to-r from-green-600 to-green-700' 
      : 'bg-gradient-to-r from-purple-600 to-blue-600';
  
  const logo = isFiverr 
    ? <FiverrLogo className="w-6 h-6" /> 
    : isUpwork 
      ? <UpworkLogo className="w-6 h-6" /> 
      : null;

  return (
    <Section id={id}>
      <div className="mb-10">
        <div className={`inline-flex items-center px-4 py-2 rounded-lg ${gradient} text-white mb-4`}>
          {logo}
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {isUpwork && (
          <p className="text-gray-400 mt-2 max-w-3xl">
            Available with Upwork&apos;s payment protection and escrow system for secure transactions.
          </p>
        )}
      </div>
      {children}
    </Section>
  );
};

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  const Navbar = () => {
    return (
      <>
        <nav className="w-full py-4 px-4 sm:px-8 flex justify-between items-center fixed top-0 z-50 bg-black/30 backdrop-blur-lg border-b border-zinc-700/30">
          <div className={`font-bold text-xl tracking-tight bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent ${spaceGrotesk.className}`}>
            Aparna<span className="text-white">_</span>Pradhan<span className="text-white">.</span>Dev
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href="#projects" 
              className="text-gray-300 hover:text-orange-400 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-white/5"
              onClick={closeMobileMenu}
            >
              Projects
            </a>
            <a 
              href="https://aparnap2.github.io/Aparna-Pradhan-blogs" 
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-white/5"
              onClick={closeMobileMenu}
            >
              Blogs
            </a>
            <a 
              href="#pricing" 
              className="text-gray-300 hover:text-orange-400 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-white/5"
              onClick={closeMobileMenu}
            >
              Pricing
            </a>
            <a 
              href="#contact" 
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-white/5"
              onClick={closeMobileMenu}
            >
              Contact
            </a>
            <a 
              href="https://github.com/aparnap2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
            <a 
              href="#contact" 
              className="ml-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-all"
            >
              Hire Me
            </a>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 pt-20 bg-black/80 backdrop-blur-sm md:hidden" onClick={closeMobileMenu}>
            <div className="bg-gradient-to-b from-purple-900/90 to-zinc-900/95 p-6 shadow-lg border-t border-zinc-800">
              <div className="flex flex-col space-y-4">
                <a 
                  href="#projects" 
                  className="text-gray-300 hover:text-orange-400 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Projects
                </a>
                <a 
                  href="https://aparnap2.github.io/Aparna-Pradhan-blogs" 
                  className="text-gray-300 hover:text-purple-400 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Blogs
                </a>
                <a 
                  href="#pricing" 
                  className="text-gray-300 hover:text-orange-400 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Pricing
                </a>
                <a 
                  href="#contact" 
                  className="text-gray-300 hover:text-purple-400 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Contact
                </a>
                <a 
                  href="https://github.com/aparnap2" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-300 hover:text-white px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
                <a 
                  href="#contact" 
                  className="w-full text-center bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium py-2.5 px-4 rounded-lg hover:opacity-90 transition-all mt-2"
                  onClick={closeMobileMenu}
                >
                  Hire Me
                </a>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <AnimatePresence>
        {isLoading && <LoadingAnimation />}
      </AnimatePresence>
      
      <Navbar />
      
      <div className="pt-24">
        {/* Modern Grid Background */}
        <div className="fixed inset-0 -z-10">
          <ModernGridBackground />
        </div>
        
        {/* Overlay for better text readability - more transparent to show grid */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-gray-900/70 via-gray-900/30 to-gray-900/70" />

        {/* Hero Section */}
        <header className="flex flex-col-reverse md:flex-row items-center justify-center gap-10 px-4 max-w-6xl mx-auto w-full py-12 md:py-20">
          <div className="w-full md:w-2/3 text-center md:text-left">
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-orange-400 via-purple-400 to-pink-400 text-transparent bg-clip-text leading-tight ${spaceGrotesk.className}`}>
              Your AI Transformation Partner for Solopreneurs & Growing Businesses
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-4 max-w-2xl leading-relaxed">
              I&apos;m Aparna Pradhan, a full-stack web and React Native developer who builds
              robust, production-grade AI agents and automation solutions that solve real
              business pain points — not generic AI demos.
            </p>
            <p className="text-lg sm:text-xl text-gray-300 mb-4 max-w-2xl leading-relaxed">
              Stop wasting time on repetitive tasks. Let intelligent agents handle your
              lead generation, client onboarding, support automation, proposal writing,
              and workflow orchestration.
            </p>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              No smoke and mirrors — just reliable code, data privacy, and measurable ROI.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <a 
                href="#contact" 
                className="relative group bg-gradient-to-r from-orange-400 to-orange-500 text-black px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10">Book Free Automation Audit</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="#projects"
                className="relative group border-2 border-orange-400 text-orange-400 px-8 py-3.5 rounded-xl font-bold hover:bg-orange-400/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10">See My AI Agents in Action</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-purple-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
            </div>
          </div>
          <div className="w-56 h-56 md:w-64 md:h-64 mx-auto md:mx-0 rounded-full border-4 border-purple-400 shadow-2xl overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-purple-900 hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-105">
            <Image 
              src={me} 
              alt="Aparna Pradhan" 
              width={300} 
              height={300} 
              className="object-cover w-full h-full hover:scale-105 transition-transform duration-700" 
              priority 
            />
          </div>
        </header>

        {/* About Section */}
        <Section id="about" title="Built by a Developer Who Solves Real Problems">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-gray-300 mb-6">
              Every AI agent I build starts as my own problem to solve — so I know it delivers value.
            </p>
            <p className="text-lg text-gray-300 mb-6">
              At my agency, I specialize in architecting AI-driven automation that combines
              deep software engineering with AI&apos;s practical potential. From multi-agent
              orchestration platforms to secure, privacy-first knowledge base chatbots,
              my mission is unlocking founder productivity through intelligent automation.
            </p>
            <p className="text-lg text-gray-300 mb-12">
              I serve modern entrepreneurs who want durable, extensible, and transparent
              AI solutions — not black box gimmicks or no-code templates that break.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 p-6 rounded-xl border border-zinc-700">
              <h3 className="text-xl font-bold text-white mb-3">🔧 Production-Grade Development</h3>
              <p className="text-gray-400">
                Full-stack web & React Native with AI agent integration, LangChain,
                LangGraph, RAG pipelines, and vector databases
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 p-6 rounded-xl border border-zinc-700">
              <h3 className="text-xl font-bold text-white mb-3">🚫 Beyond Generic LLMs</h3>
              <p className="text-gray-400">
                Custom automation and scraping pipelines that work where typical
                AI tools fall short — handling your specific data and workflows
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800/50 p-6 rounded-xl border border-zinc-700">
              <h3 className="text-xl font-bold text-white mb-3">💰 ROI-Focused Solutions</h3>
              <p className="text-gray-400">
                Every automation is built to save hours weekly, increase conversions,
                or streamline operations with measurable business impact
              </p>
            </div>
          </div>
        </Section>

        {/* Projects Section */}
        <Section id="projects" title="Featured Projects">
          <div className="grid grid-cols-1 gap-10 max-w-5xl mx-auto">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </Section>

        {/* Services Section */}
        <Section id="services" title="AI Automation Services for Modern Businesses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Service 1 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-center">
              <h3 className="text-2xl mb-4">🔍</h3>
              <h4 className="font-bold text-white text-lg mb-2">Business Process Audits</h4>
              <p className="text-gray-400 text-sm mb-4">I analyze your workflows and identify automation opportunities with clear ROI projections.</p>
              <p className="font-semibold text-orange-400 mb-2">$60 - $180</p>
              <p className="text-xs text-gray-500">1-2 weeks delivery</p>
            </div>
            {/* Service 2 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-center">
              <h3 className="text-2xl mb-4">🤖</h3>
              <h4 className="font-bold text-white text-lg mb-2">Custom AI Agents</h4>
              <p className="text-gray-400 text-sm mb-4">Lead generation bots, proposal automation, customer support agents, and workflow orchestration.</p>
              <p className="font-semibold text-orange-400 mb-2">$180 - $480</p>
              <p className="text-xs text-gray-500">2-3 weeks delivery</p>
            </div>
            {/* Service 3 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-center">
              <h3 className="text-2xl mb-4">🏢</h3>
              <h4 className="font-bold text-white text-lg mb-2">Enterprise AI Systems</h4>
              <p className="text-gray-400 text-sm mb-4">Multi-agent platforms, custom dashboards, complex integrations, and white-label solutions.</p>
              <p className="font-semibold text-orange-400 mb-2">$480 - $1,320+</p>
              <p className="text-xs text-gray-500">4-6 weeks delivery</p>
            </div>
            {/* Service 4 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-center">
              <h3 className="text-2xl mb-4">🔧</h3>
              <h4 className="font-bold text-white text-lg mb-2">Ongoing Support</h4>
              <p className="text-gray-400 text-sm mb-4">Maintenance, updates, feature additions, and performance optimization.</p>
              <p className="font-semibold text-orange-400 mb-2">$30 - $90/month</p>
              <p className="text-xs text-gray-500">Flexible, no lock-in</p>
            </div>
          </div>
        </Section>

        {/* Pricing Section */}
        <Section id="pricing" title="Transparent, Value-Driven Pricing">
          <p className="text-lg text-gray-400 max-w-3xl mx-auto text-center mb-12">
            Pricing is straightforward and tailored for Indian and global bootstrapped founders.
            Every project focuses on clear ROI — save hours weekly, grow your pipeline faster,
            and streamline operations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
              <h3 className="font-bold text-white text-xl mb-2">Quick Win Automations</h3>
              <p className="text-orange-400 font-semibold text-2xl mb-4">$60 - $180</p>
              <p className="text-gray-400 text-sm mb-4">Perfect for solving one specific pain point quickly.</p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-center gap-2">✓<span>Inbox organization agents</span></li>
                <li className="flex items-center gap-2">✓<span>Simple lead scoring</span></li>
                <li className="flex items-center gap-2">✓<span>Basic proposal automation</span></li>
                <li className="flex items-center gap-2">✓<span>WhatsApp/Email responders</span></li>
              </ul>
            </div>
            {/* Tier 2 */}
            <div className="bg-purple-900/30 p-6 rounded-xl border border-purple-500 ring-2 ring-purple-500">
              <h3 className="font-bold text-white text-xl mb-2">Custom Business Solutions</h3>
              <p className="text-orange-400 font-semibold text-2xl mb-4">$180 - $480</p>
              <p className="text-gray-400 text-sm mb-4">Multi-channel automations and scraper integrations.</p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-center gap-2">✓<span>LinkedIn + Google Sheets integration</span></li>
                <li className="flex items-center gap-2">✓<span>Multi-platform lead harvesting</span></li>
                <li className="flex items-center gap-2">✓<span>Onboarding orchestrators</span></li>
                <li className="flex items-center gap-2">✓<span>Support ticket automation</span></li>
              </ul>
            </div>
            {/* Tier 3 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
              <h3 className="font-bold text-white text-xl mb-2">Enterprise AI Systems</h3>
              <p className="text-orange-400 font-semibold text-2xl mb-4">$480 - $1,320+</p>
              <p className="text-gray-400 text-sm mb-4">Full-stack AI agents and multi-tool orchestration.</p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-center gap-2">✓<span>Multi-agent workflow systems</span></li>
                <li className="flex items-center gap-2">✓<span>Custom dashboards & analytics</span></li>
                <li className="flex items-center gap-2">✓<span>Complex API integrations</span></li>
                <li className="flex items-center gap-2">✓<span>White-label deployment</span></li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Custom Services Section */}
        <Section id="custom-services" title="Custom Services & Pricing">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
              <h3 className="font-bold text-white text-xl mb-2">Consultation & Strategy</h3>
              <p className="text-orange-400 font-semibold text-2xl mb-4">$120 - $360</p>
              <p className="text-gray-400 text-sm mb-4">AI Transformation Audit & Roadmap</p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-center gap-2">✓<span>1-2 weeks delivery</span></li>
                <li className="flex items-center gap-2">✓<span>Process analysis, automation opportunities, technical roadmap, ROI projections</span></li>
                <li className="flex items-center gap-2">✓<span>Perfect For: Companies planning AI adoption</span></li>
                <li className="flex items-center gap-2">✓<span>Positioning: &quot;Before you invest in AI, know exactly what will deliver results&quot;</span></li>
              </ul>
            </div>
            {/* Tier 2 */}
            <div className="bg-purple-900/30 p-6 rounded-xl border border-purple-500 ring-2 ring-purple-500">
              <h3 className="font-bold text-white text-xl mb-2">Growth Solutions</h3>
              <p className="text-orange-400 font-semibold text-2xl mb-4">$360 - $900</p>
              <p className="text-gray-400 text-sm mb-4">Custom AI Agent Development</p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-center gap-2">✓<span>2-4 weeks delivery</span></li>
                <li className="flex items-center gap-2">✓<span>Tailored multi-agent systems with your specific integrations</span></li>
                <li className="flex items-center gap-2">✓<span>Perfect For: Established SMBs with defined processes</span></li>
                <li className="flex items-center gap-2">✓<span>Positioning: &quot;AI agents built around your existing tools and workflows&quot;</span></li>
              </ul>
            </div>
            {/* Tier 3 */}
            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
              <h3 className="font-bold text-white text-xl mb-2">Enterprise Transformation</h3>
              <p className="text-orange-400 font-semibold text-2xl mb-4">$900 - $1,800+</p>
              <p className="text-gray-400 text-sm mb-4">Complete AI Automation Platform</p>
              <ul className="text-gray-300 text-sm space-y-2">
                <li className="flex items-center gap-2">✓<span>4-8 weeks delivery</span></li>
                <li className="flex items-center gap-2">✓<span>Multi-agent orchestration, analytics, custom interfaces, ongoing support</span></li>
                <li className="flex items-center gap-2">✓<span>Perfect For: Companies ready for comprehensive AI adoption</span></li>
                <li className="flex items-center gap-2">✓<span>Positioning: &quot;Your complete AI transformation partner&quot;</span></li>
              </ul>
            </div>
          </div>
        </Section>

        {/* Contact Section */}
        <Section id="contact" title="Ready to Automate Your Toughest Workflows?">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-gray-300 mb-12">
              Stop doing repetitive work manually. Let&apos;s build AI agents that solve your
              specific business challenges and deliver measurable results.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Card 1 */}
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-left">
                <h3 className="text-2xl mb-2">🔍</h3>
                <h4 className="font-bold text-white text-lg mb-2">Free Automation Audit</h4>
                <p className="text-gray-400 text-sm mb-4">I&apos;ll analyze your workflows and show you exactly how AI can save time and increase efficiency.</p>
                <a href="mailto:softservicesinc.portfolio@gmail.com" className="text-orange-400 font-semibold hover:underline">Book 15-Min Discovery Call →</a>
              </div>
              {/* Card 2 */}
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 text-left">
                <h3 className="text-2xl mb-2">💡</h3>
                <h4 className="font-bold text-white text-lg mb-2">Custom Solution Design</h4>
                <p className="text-gray-400 text-sm mb-4">Have a specific challenge? Let me prototype and demo a solution risk-free.</p>
                <a href="mailto:softservicesinc.portfolio@gmail.com" className="text-orange-400 font-semibold hover:underline">Describe Your Challenge →</a>
              </div>
            </div>
            <p className="text-gray-400">
              No jargon, no hype, just working code that delivers results.
              Every project comes with clear success metrics and ROI tracking.
            </p>
          </div>
        </Section>
        <Footer />
        {/* Floating Chatbot */}
        <style jsx global>{`
          .navbar {
            transition: all 0.3s ease;
          }
          .navbar.scrolled {
            background: rgba(15, 15, 20, 0.8);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          }
          .glass {
            background: rgba(15, 15, 20, 0.7);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}