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

// Dynamically import pricing components with no SSR
const FiverrPricing = dynamic(
  () => import('./component/pricing/FiverrPricing').then(mod => mod.FiverrPricing),
  { ssr: false }
);

const UpworkPricing = dynamic(
  () => import('./component/pricing/UpworkPricing').then(mod => mod.UpworkPricing),
  { ssr: false }
);

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
  const [activeTab, setActiveTab] = useState('fiverr');

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
              Building AI-Integrated SAAS &<br />Custom AI Agents for Niche Businesses
            </h1>
            <div className={`relative inline-block mb-8 group`}>
              <div className={`text-xl sm:text-2xl md:text-3xl font-medium text-gray-300 ${firaCode.className} relative z-10 px-1`}>
                <span className="font-bold bg-gradient-to-r from-orange-400 to-purple-500 text-transparent bg-clip-text">Aparna Pradhan</span>
                <span className="mx-3 text-gray-500">—</span>
                <span>Full Stack AI Developer</span>
                <span className="mx-1.5 text-gray-500">•</span>
                <span className="text-gray-400">India</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400/20 to-purple-400/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-all duration-300 -z-0"></div>
            </div>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl leading-relaxed">
              I help startups and businesses <span className="text-orange-300 font-medium">automate workflows</span>, 
              <span className="text-purple-300 font-medium"> integrate AI</span>, and 
              <span className="text-pink-300 font-medium"> scale with robust, modern tech</span>.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <a 
                href="#contact" 
                className="relative group bg-gradient-to-r from-orange-400 to-orange-500 text-black px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10">Book a Free Consultation</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <a 
                href="#pricing" 
                className="relative group border-2 border-orange-400 text-orange-400 px-8 py-3.5 rounded-xl font-bold hover:bg-orange-400/10 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10">View Pricing</span>
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

        {/* Expertise Section */}
        <Section id="expertise" title="My Expertise">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            

            {/* Full-Stack Development */}
            <motion.div 
              className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 rounded-2xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                <FiCode className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className={`text-xl font-bold text-white mb-3 ${spaceGrotesk.className}`}>Full-Stack Development</h3>
              <p className="text-gray-400 mb-4">End-to-end web development with modern technologies and best practices.</p>
              <div className="flex flex-wrap gap-2">
                {['Next.js', 'React', 'Node.js', 'MongoDB', 'PostgreSQL', 'Prisma', 'Redis', 'TailwindCSS', 'ShadcnUI', 'Stripe', 'NextAuth', 'JWT', 'Clerk', 'Upstash', 'grpahql'].map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-900/50 text-orange-300 text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Mobile Development */}
            <motion.div 
              className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                <FaMobileAlt className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className={`text-xl font-bold text-white mb-3 ${spaceGrotesk.className}`}>Mobile Development</h3>
              <p className="text-gray-400 mb-4">Building cross-platform mobile applications with React Native.</p>
              <div className="flex flex-wrap gap-2">
                {[ 'Expo','nativewind', 'zustand', 'Firebase / appwrite / supabase / custom ', 'Push Notifications', 'Offline First'].map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* AI Integration */}
            <motion.div 
              className="bg-gradient-to-br from-green-900/30 to-green-800/10 rounded-2xl p-6 border border-green-500/20 hover:border-green-400/40 transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500/30 transition-colors">
                <FaRobot className="w-6 h-6 text-green-400" />
              </div>
              <h3 className={`text-xl font-bold text-white mb-3 ${spaceGrotesk.className}`}>AI Integration</h3>
              <p className="text-gray-400 mb-4">Seamlessly integrating AI capabilities into existing applications.</p>
              <div className="flex flex-wrap gap-2">
                {['LLM API', 'LangChain', 'Vector DBs', 'third party APIs', 'AI agents', 'workflow automation'].map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-green-900/50 text-green-300 text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Backend Development */}
            <motion.div 
              className="bg-gradient-to-br from-red-900/30 to-red-800/10 rounded-2xl p-6 border border-red-500/20 hover:border-red-400/40 transition-all duration-300 group"
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-500/30 transition-colors">
                <FiServer className="w-6 h-6 text-red-400" />
              </div>
              <h3 className={`text-xl font-bold text-white mb-3 ${spaceGrotesk.className}`}>Backend Development</h3>
              <p className="text-gray-400 mb-4">Scalable and efficient server-side solutions for your applications.</p>
              <div className="flex flex-wrap gap-2">
                {['Node.js', 'Express', 'Django', 'FastAPI', 'MongoDB', 'PostgreSQL'].map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-red-900/50 text-red-300 text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

       
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
        <section id="pricing" className="relative py-16 sm:py-24 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-black/50 to-green-900/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent w-full h-full opacity-20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <SectionTitle title="Pricing & Services" subtitle="Choose the perfect plan that fits your needs. Whether you prefer fixed-price projects or hourly contracts, I&apos;ve got you covered." />
            
            <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-purple-900/30 to-orange-900/20 rounded-xl border border-purple-500/20 relative overflow-hidden backdrop-blur-sm">
              <div className="relative z-10">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium text-white">Heads up!</span> The pricing and services shown here are for demonstration purposes to give you a high-level idea. Each project is unique, and I&apos;m happy to tailor my services to your specific needs and budget. Let&apos;s discuss how I can help bring your vision to life!
                    </p>
                  </div>
                </div>
              </div>
              {/* Animated background elements */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full mix-blend-overlay blur-xl"></div>
              <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-purple-500/10 rounded-full mix-blend-overlay blur-xl"></div>
            </div>

            {/* Platform Tabs */}
            <div className="flex justify-center mb-12">
              <div className="inline-flex rounded-lg bg-gray-800 p-1">
                <button 
                  onClick={() => setActiveTab('fiverr')}
                  className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'fiverr' 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Fiverr Services
                </button>
                <button 
                  onClick={() => setActiveTab('upwork')}
                  className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'upwork' 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/20' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Upwork Services
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="relative min-h-[800px]">
              {/* Fiverr Pricing */}
              <div 
                key="fiverr" 
                className={`transition-opacity duration-300 ${activeTab === 'fiverr' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
              >
                <FiverrPricing />
              </div>
              
              {/* Upwork Pricing */}
              <div 
                key="upwork" 
                className={`transition-opacity duration-300 ${activeTab === 'upwork' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
              >
                <UpworkPricing />
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="relative pt-20 pb-32 sm:pt-24 sm:pb-40 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>
                Ready to Transform Your Business with AI?
              </h2>
              <p className={`text-lg text-gray-300 max-w-2xl mx-auto ${firaCode.className}`}>
                Let&apos;s collaborate to build intelligent solutions that drive growth and efficiency for your business.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 p-6 sm:p-8 lg:p-10 shadow-xl">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className={`text-2xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>Get in Touch</h3>
                  <p className="text-gray-300 mb-6">
                    Have a project in mind or want to discuss how AI can benefit your business? 
                    I&apos;m here to help you navigate the world of AI and build solutions that make an impact.
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <a 
                      href="mailto:softservicesinc.portfolio@gmail.com" 
                      className="flex items-center text-gray-300 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3 text-orange-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                      </svg>
                      softservicesinc.portfolio@gmail.com
                    </a>
                    <a 
                      href="https://goo.gl/maps/SQUjHtzSMfeZfmWR7" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-gray-300 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5 mr-3 text-orange-400" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      West Bengal, India 
                    </a>
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="text-lg font-semibold text-white mb-3">Connect with me</h4>
                    <div className="flex space-x-4">
                      <a 
                        href="https://www.linkedin.com/in/aparna-pradhan-06b882215/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                        aria-label="LinkedIn"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      </a>
                      <a 
                        href="https://x.com/Aparna_108_dev/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-400 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                        aria-label="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                      
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/40 to-orange-900/30 p-6 sm:p-8 rounded-xl border border-purple-500/30 h-full flex flex-col justify-center backdrop-blur-sm shadow-lg">
                  <h4 className={`text-xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>Send Me a Message</h4>
                  <p className="text-gray-300 mb-6">
                    Have a project in mind or questions about my services? Feel free to reach out through email or any of my social media channels.
                  </p>
                  <a 
                    href="mailto:softservicesinc.portfolio@gmail.com" 
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-orange-500/30"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Send Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
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