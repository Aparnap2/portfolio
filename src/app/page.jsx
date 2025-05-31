"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTerminal, FiCpu, FiCodesandbox } from 'react-icons/fi';
import me from './public/images/me.jpeg';
import { Footer } from './component/footer';
import SpatialGrid from './component/chatbot/ModernGridBackground';
import { projects } from './projects';
import Chatbot from './component/chatbot/chatbot';
import { ProjectCard } from './component/ProjectCard';

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
    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 bg-gradient-to-r from-purple-400 to-orange-400 text-transparent bg-clip-text">{title}</h2>
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

// Pricing Card Component
const PricingCard = ({ title, price, description, features, isPopular, isRecommended, buttonText, buttonHref, buttonClassName }) => (
  <div className={`bg-gradient-to-br from-purple-900/40 to-orange-500/20 p-6 sm:p-8 rounded-2xl border-2 border-orange-400/50 transform hover:scale-[1.02] transition-all hover:shadow-lg hover:shadow-orange-500/20 relative overflow-hidden ${isPopular || isRecommended ? 'h-full' : ''}`}>
    {isPopular && (
      <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        POPULAR
      </div>
    )}
    {isRecommended && (
      <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
        RECOMMENDED
      </div>
    )}
    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
    <div className="text-3xl font-bold text-orange-400 mb-4 sm:mb-6">{price}</div>
    <p className="text-gray-300 mb-6">{description}</p>
    <ul className="space-y-3 mb-6 sm:mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <span className="text-green-400 mr-2">✓</span>
          <span className="text-gray-300">{feature}</span>
        </li>
      ))}
    </ul>
    <a 
      href={buttonHref} 
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full block text-center ${buttonClassName}`}
    >
      {buttonText}
    </a>
  </div>
);

// Chatbot Pricing Card Component (smaller variant)
const ChatbotPricingCard = ({ title, price, description, features, isRecommended, buttonHref }) => (
  <PricingCard 
    title={title}
    price={price}
    description={description}
    features={features}
    isRecommended={isRecommended}
    buttonText="Get Started on Fiverr"
    buttonHref={buttonHref}
    buttonClassName="bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all"
  />
);

// Main Pricing Card Component
const MainPricingCard = ({ title, price, description, features, isPopular, buttonHref }) => (
  <PricingCard 
    title={title}
    price={price}
    description={description}
    features={features}
    isPopular={isPopular}
    buttonText="Get Started on Fiverr"
    buttonHref={buttonHref}
    buttonClassName="bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/20"
  />
);

// Upwork Pricing Card Component
const UpworkPricingCard = ({ title, price, description, features, buttonHref }) => (
  <PricingCard 
    title={title}
    price={price}
    description={description}
    features={features}
    buttonText="Get on Upwork"
    buttonHref={buttonHref}
    buttonClassName="bg-gradient-to-r from-green-600 to-green-700 hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-green-500/20"
  />
);

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
          <div className="font-bold text-xl tracking-tight bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
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
              href="#services" 
              className="text-gray-300 hover:text-purple-400 transition-colors duration-300 px-3 py-2 rounded-lg hover:bg-white/5"
              onClick={closeMobileMenu}
            >
              Services
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
              className="text-gray-300 hover:text-white transition-colors duration-300 p-2 rounded-full hover:bg-white/10"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
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
                  href="#services" 
                  className="text-gray-300 hover:text-purple-400 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  onClick={closeMobileMenu}
                >
                  Services
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
    <div className="relative min-h-screen flex flex-col">
      <AnimatePresence>
        {isLoading && <LoadingAnimation />}
      </AnimatePresence>
      
      <Navbar />
      
      <div className="pt-24">
        {/* Background Animation */}
        <div className="fixed inset-0 -z-10">
          <SpatialGrid />
        </div>
        {/* Hero Section */}
        <header className="flex flex-col-reverse md:flex-row items-center justify-center gap-10 px-4 max-w-6xl mx-auto w-full">
          <div className="w-full md:w-2/3 text-center md:text-left">
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 bg-gradient-to-r from-orange-400 to-purple-400 text-transparent bg-clip-text">
              Building AI-Integrated SAAS & Custom AI agents for Niche Businesses
            </h1>
            <div className="text-lg sm:text-2xl mb-2 text-gray-300">Aparna Pradhan — Full Stack & AI Developer, India</div>
            <p className="mt-3 mb-6 text-base sm:text-lg text-gray-400 max-w-xl">
              I help startups and businesses automate workflows, integrate AI, and scale with robust, modern tech.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <a href="#contact" className="bg-orange-400 text-black px-6 py-3 rounded-lg font-bold shadow hover:bg-orange-300 transition">Book a Free Consultation</a>
              <a href="#pricing" className="border border-orange-400 text-orange-400 px-6 py-3 rounded-lg font-bold hover:bg-orange-400/20 transition">View Pricing</a>
            </div>
          </div>
          <div className="w-48 h-48 mx-auto md:mx-0 rounded-full border-4 border-purple-400 shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-purple-900">
            <Image src={me} alt="Aparna Pradhan" width={220} height={220} className="object-cover w-full h-full" priority />
          </div>
        </header>

        {/* Services Section */}
        <Section id="services" title="My Expertise">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            <div className="bg-zinc-900/80 p-7 rounded-xl border border-purple-700 hover:shadow-lg transition group">
              <div className="mb-4 text-3xl text-orange-400 group-hover:scale-110 transition-transform"><FiTerminal /></div>
              <h3 className="text-xl font-bold text-white mb-3">AI Integration & Automation</h3>
              <p className="text-gray-200 mb-4">Specialized AI solutions that go beyond typical LLM capabilities.</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Custom AI Agents & Workflows</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Process Automation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">RAG Systems</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Model Context Protocol (MCP)</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-900/80 p-7 rounded-xl border border-orange-400/50 hover:shadow-lg transition group">
              <div className="mb-4 text-3xl text-purple-400 group-hover:scale-110 transition-transform"><FiCodesandbox /></div>
              <h3 className="text-xl font-bold text-white mb-3">Full-Stack Development</h3>
              <p className="text-gray-200 mb-4">End-to-end web and mobile solutions with AI at their core.</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">React Native & Web Apps</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Third-party API Integration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">WhatsApp Business API</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Real-time Data Processing</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-zinc-900/80 p-7 rounded-xl border border-purple-700 hover:shadow-lg transition group">
              <div className="mb-4 text-3xl text-orange-400 group-hover:scale-110 transition-transform"><FiCpu /></div>
              <h3 className="text-xl font-bold text-white mb-3">Data & Infrastructure</h3>
              <p className="text-gray-200 mb-4">Scalable backends and data solutions for AI applications.</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Vector & Graph Databases</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Intelligent Caching</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">History-Aware Generation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span className="text-gray-300">Performance Optimization</span>
                </li>
              </ul>
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

        {/* Pricing Section */}
        <PlatformSection id="pricing" title="Fiverr Services" isFiverr>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            <MainPricingCard 
              title="Basic RAG Chatbot"
              price="$107"
              description="AI chatbot with RAG capabilities"
              features={[
                'Document search (PDFs, websites)',
                '3-day delivery',
                '3 Revisions',
                'Source code',
                'Setup file',
                'Detailed code comments'
              ]}
              buttonHref="https://www.fiverr.com/s/5rozwpk"
            />

            <MainPricingCard 
              title="Full AI Web App"
              price="$214"
              description="Custom AI app with your business data"
              features={[
                'Custom AI web application',
                '5-day delivery',
                '5 Revisions',
                'Source code',
                'Deployment support',
                'Basic documentation',
                '1 month support'
              ]}
              isPopular
              buttonHref="https://www.fiverr.com/s/5rozwpk"
            />


            <MainPricingCard 
              title="Multi-Agent AI Platform"
              price="$429"
              description="Advanced AI application with multiple agents"
              features={[
                'Multi-agent system',
                '7-day delivery',
                'Unlimited Revisions',
                'Source code',
                'Deployment support',
                'Detailed documentation',
                '3 months support',
                'Agent Custom Development',
                'Setup file',
                'Detailed code comments'
              ]}
              buttonHref="https://www.fiverr.com/s/5rozwpk"
            />
          </div>

          <h3 className="text-2xl font-bold text-center mb-8 text-white">AI Chatbot Solutions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <ChatbotPricingCard 
              title="Basic – Starter Bot"
              price="$64"
              description="Simple AI chatbot with basic features"
              features={[
                '3-day delivery',
                '3 Revisions',
                'AI LLM model integration',
                'Web or React Native integration'
              ]}
              buttonHref="https://www.fiverr.com/Q7z8e1y"
            />

            <ChatbotPricingCard 
              title="Standard – Smart Agent"
              price="$129"
              description="Conversational AI with Langchain, pydantic, and RAG integration (PDF or website)"
              features={[
                '5-day delivery',
                '5 Revisions',
                'Web or React Native integration',
                'Chat history',
                'Basic analytics',
                '1 month support'
              ]}
              isRecommended
              buttonHref="https://www.fiverr.com/Q7z8e1y"
            />

            <ChatbotPricingCard 
              title="Premium – Advanced AI"
              price="$268"
              description="Advanced AI chatbot with workflows and automations"
              features={[
                '7-day delivery',
                'Unlimited Revisions',
                'Web or React Native integration',
                'Chat history',
                'Advanced analytics',
                '3 months support',
                'Custom workflows',
                'Multi-language support',
                'API access'
              ]}
              buttonHref="https://www.fiverr.com/Q7z8e1y"
            />
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 mt-8">
            <h4 className="text-xl font-semibold mb-4 text-green-400">
              <FiverrLogo className="w-6 h-6 inline-block mr-2" />
              Why Choose Fiverr?
            </h4>
            <ul className="grid md:grid-cols-2 gap-4 text-gray-300">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">Fast Turnaround</span>
                  <p className="text-sm text-gray-400">Quick project start and delivery with Fiverr&apos;s streamlined process</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">Fixed Pricing</span>
                  <p className="text-sm text-gray-400">Clear, upfront pricing with no hidden costs</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">24/7 Support</span>
                  <p className="text-sm text-gray-400">Round-the-clock customer service for any assistance</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">Secure Payments</span>
                  <p className="text-sm text-gray-400">Your payment is protected until you approve the work</p>
                </div>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h5 className="font-medium text-green-400 mb-2">Ideal For:</h5>
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Quick Projects</span>
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Fixed Budgets</span>
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Standard Solutions</span>
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Fast Turnaround</span>
              </div>
            </div>
          </div>
        </PlatformSection>

        {/* Upwork Services Section */}
        <PlatformSection id="upwork-services" title="Upwork Services" isUpwork>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            <UpworkPricingCard 
              title="Starter"
              price="$45"
              description="Basic AI Chatbot with essential features"
              features={[
                '4 days delivery',
                '1 Revision',
                'Up to 10 conversation steps',
                '1 Messaging Platform',
                'Basic Q&A capabilities',
                'Bug fixes available as add-ons'
              ]}
              buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            />

            <UpworkPricingCard 
              title="Standard"
              price="$120"
              description="Enhanced chatbot with more capabilities"
              features={[
                '7 days delivery',
                '2 Revisions',
                'Up to 25 conversation steps',
                '2 Messaging Platforms',
                'Chatbot Flow Design',
                'Conversation Script',
                'Priority support'
              ]}
              isPopular
              buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            />

            <UpworkPricingCard 
              title="Advanced"
              price="$250"
              description="Fully customized AI chatbot solution"
              features={[
                '10 days delivery',
                '5 Revisions',
                'Up to 50 conversation steps',
                '3 Messaging Platforms',
                'API Integration',
                'Action Plan',
                'Chatbot Flow Design',
                'Conversation Script',
                'Priority support & maintenance'
              ]}
              buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            />
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 mt-8">
            <h4 className="text-xl font-semibold mb-4 text-green-400">
              <UpworkLogo className="w-6 h-6 inline-block mr-2" />
              Why Choose Upwork?
            </h4>
            <ul className="grid md:grid-cols-2 gap-4 text-gray-300">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">Milestone Payments</span>
                  <p className="text-sm text-gray-400">Pay as we make progress on larger projects</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">Long-term Projects</span>
                  <p className="text-sm text-gray-400">Ideal for ongoing development and support</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">Hourly Contracts</span>
                  <p className="text-sm text-gray-400">Flexible billing for evolving project scopes</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <div>
                  <span className="font-medium">Team Collaboration</span>
                  <p className="text-sm text-gray-400">Better for projects requiring multiple team members</p>
                </div>
              </li>
            </ul>
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h5 className="font-medium text-green-400 mb-2">Ideal For:</h5>
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Complex Projects</span>
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Long-term Work</span>
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Custom Solutions</span>
                <span className="bg-green-900/50 text-green-300 text-xs px-3 py-1 rounded-full">Ongoing Support</span>
              </div>
            </div>
          </div>
        </PlatformSection>

        {/* Contact */}
        <Section id="contact" title="Ready to Boost Your Business?">
          <p className="text-lg text-gray-300 mb-6">Let’s turn your ideas into reality with AI-driven solutions tailored for your business.</p>
          <a href="mailto:softservicesinc.portfolio@gmail.com" className="inline-flex items-center px-8 py-4 text-lg font-bold text-black bg-orange-400 hover:bg-orange-300 rounded-lg transition-all shadow">
            Contact Me Today
          </a>
        </Section>
        <Chatbot/>
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