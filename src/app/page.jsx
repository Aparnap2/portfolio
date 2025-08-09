"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import me from './public/images/me.jpeg';
import { Footer } from './component/footer';
import ModernGridBackground from './component/chatbot/ModernGridBackground';
import dynamic from 'next/dynamic';
import { spaceGrotesk } from './fonts';
import Chatbot from './component/chatbot/chatbot';
import { getTopRepositories } from '../lib/github.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('starter');
  const [projects, setProjects] = useState([]);
  const [expandedReadmes, setExpandedReadmes] = useState({});

  const toggleReadme = (projectId) => {
    setExpandedReadmes(prevState => ({
      ...prevState,
      [projectId]: !prevState[projectId]
    }));
  };

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
    
    const timer = setTimeout(async () => {
      const repos = await getTopRepositories(4);
      setProjects(repos);
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
              I Turn Your Daily Computer Tasks Into 5-Minute Setups
            </h1>
            <p className="text-lg sm:text-xl text-orange-300 mb-4 max-w-2xl leading-relaxed font-semibold">
              Small Business Automation Specialist | Custom Code, Not Templates
            </p>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 max-w-2xl">
              <p className="text-gray-200 leading-relaxed">
                Hi! I&apos;m Aparna, and I help small business owners stop doing the same computer tasks over and over.
                <br /><br />
                While others use drag-and-drop tools that break, I write actual code that works reliably.
                <br /><br />
                <span className="text-purple-300 font-medium">No monthly subscriptions. No platform lock-in. Just automation that saves you time every single day.</span>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl">
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                <div className="text-green-400 text-xl mb-2">✅</div>
                <h3 className="text-white font-semibold text-sm mb-1">Custom Code You Own</h3>
                <p className="text-gray-300 text-xs">No monthly fees or platform dependencies</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                <div className="text-yellow-400 text-xl mb-2">⚡</div>
                <h3 className="text-white font-semibold text-sm mb-1">Fast Delivery</h3>
                <p className="text-gray-300 text-xs">Most automations ready in 2-3 days</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30">
                <div className="text-blue-400 text-xl mb-2">🛡️</div>
                <h3 className="text-white font-semibold text-sm mb-1">Money-Back Promise</h3>
                <p className="text-gray-300 text-xs">If it doesn&apos;t work as promised, full refund</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <a 
                href="#contact" 
                className="relative group bg-gradient-to-r from-orange-400 to-orange-500 text-black px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="relative z-10">Free 15-Minute Automation Audit</span>
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

        {/* Projects Section */}
        <Section id="projects" title="Success Stories">
          <div className="max-w-6xl mx-auto">
            <p className="text-center text-gray-300 mb-12">Latest projects from my GitHub portfolio</p>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Loading projects...</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {projects.map((project, index) => (
                <div key={project.id} className={`bg-gray-900/50 rounded-xl p-6 border ${
                  index === 1 ? 'border-purple-500/50' : 'border-gray-700/50'
                }`}>
                  <h3 className="text-xl font-bold text-white mb-4">{project.title}</h3>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {project.stars > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400 text-sm">
                          ⭐ {project.stars}
                        </span>
                      )}
                      {project.language && (
                        <span className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded text-xs">
                          {project.language}
                        </span>
                      )}
                    </div>
                    {project.url && (
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View Code →
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => toggleReadme(project.id)}
                    className="text-orange-400 hover:text-orange-300 text-sm font-semibold mb-4"
                  >
                    {expandedReadmes[project.id] ? 'Hide README' : 'Show README'}
                  </button>
                  {expandedReadmes[project.id] && (
                    <div className="prose prose-sm prose-invert max-w-none text-gray-300 max-h-60 overflow-y-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.readme}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        </Section>

        <Section id="pricing" title="Service Offerings">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-lg text-gray-300 mb-4">
                Clear pricing for common automation needs - no &quot;it depends&quot; quotes
              </p>
              <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Why My Pricing Is Different</h3>
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <p className="text-red-400 mb-2">❌ Most freelancers: &quot;It depends on complexity&quot;</p>
                    <p className="text-red-400 mb-2">❌ No-code tools: $50-200/month forever</p>
                    <p className="text-red-400">❌ Templates: &quot;Customize it yourself&quot;</p>
                  </div>
                  <div>
                    <p className="text-green-400 mb-2">✅ Me: Clear, upfront pricing</p>
                    <p className="text-green-400 mb-2">✅ One-time payment, you own it forever</p>
                    <p className="text-green-400">✅ Custom code for your business</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
                <h3 className="text-2xl font-bold text-orange-400 mb-2 text-center">Quick Fixes</h3>
                <p className="text-center text-orange-400 text-xl font-semibold mb-4">$75 - $150</p>
                <div className="space-y-6 text-sm">
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Contact Form Automation - $100</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Automatically sort inquiries by type (sales, support, general)</li>
                      <li>• Send personalized auto-replies to each category</li>
                      <li>• Route urgent requests to your phone/email</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Service businesses getting 10+ inquiries daily</p>
                  </div>
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Email Auto-Responder Pro - $75</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Professional automated responses for contact forms</li>
                      <li>• Different messages based on inquiry type</li>
                      <li>• Includes &quot;I&apos;ll get back to you within X hours&quot; promises</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Any business with a contact form</p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Basic FAQ Handler - $125</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Instantly answers your 7-10 most common questions</li>
                      <li>• Works on your website or as email automation</li>
                      <li>• Reduces &quot;simple question&quot; interruptions by 80%</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Businesses that answer the same questions daily</p>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-orange-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-orange-400 mb-2 text-center">Time Savers</h3>
                <p className="text-center text-orange-400 text-xl font-semibold mb-4">$200 - $400</p>
                <div className="space-y-6 text-sm">
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">E-commerce Order Assistant - $275</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Customers check order status without calling/emailing you</li>
                      <li>• Automated shipping notifications and tracking updates</li>
                      <li>• Simple returns and exchange request handling</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Online stores with 20+ orders weekly</p>
                  </div>
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Lead Qualification System - $325</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Automatically scores and categorizes new leads</li>
                      <li>• Sends different follow-up sequences based on interest level</li>
                      <li>• Routes hot leads directly to your phone</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Service businesses wanting better leads</p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Smart Customer Support Bot - $400</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Handles 10-15 common questions automatically</li>
                      <li>• Escalates complex issues to you with full context</li>
                      <li>• Works 24/7 without breaks or sick days</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Growing businesses tired of repetitive support</p>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700">
                <h3 className="text-2xl font-bold text-orange-400 mb-2 text-center">Business Helpers</h3>
                <p className="text-center text-orange-400 text-xl font-semibold mb-4">$500 - $800</p>
                <div className="space-y-6 text-sm">
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Multi-Platform Automation - $650</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Connect different tools (email, CRM, scheduling, etc.)</li>
                      <li>• Automate data flow between your business systems</li>
                      <li>• Eliminate manual copy-paste work</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Businesses using 3+ different software tools</p>
                  </div>
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Advanced E-commerce Suite - $750</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Complete customer service automation</li>
                      <li>• Inventory alerts and low-stock notifications</li>
                      <li>• Review request automation and management</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Established online stores ready to scale</p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Custom Business Automation - $800</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Tailored solution for your specific workflow</li>
                      <li>• Analysis of your biggest time-wasters</li>
                      <li>• Custom-built automation that fits your exact needs</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Businesses with unique processes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/10 to-purple-600/10 rounded-xl p-6 border border-orange-500/20">
              <h3 className="text-xl font-bold text-white text-center mb-4">Return on Investment</h3>
              <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-orange-400 font-semibold">$100 automation saves 2+ hours weekly</p>
                  <p className="text-green-400">= $200+ monthly value</p>
                </div>
                <div>
                  <p className="text-orange-400 font-semibold">$400 automation saves 10+ hours weekly</p>
                  <p className="text-green-400">= $1,000+ monthly value</p>
                </div>
                <div>
                  <p className="text-purple-400 font-semibold">Typical payback period:</p>
                  <p className="text-white text-lg font-bold">2-4 weeks</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section id="process" title="How It Works">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">1</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Quick Chat</h4>
                <p className="text-gray-300 text-sm">15 minutes, free - Tell me about your biggest time-wasting task</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">2</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Simple Agreement</h4>
                <p className="text-gray-300 text-sm">Clear timeline (2-5 days), 50% upfront, full refund guarantee</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">3</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Build & Test</h4>
                <p className="text-gray-300 text-sm">Daily updates, thorough testing, you approve before final payment</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">4</span>
                </div>
                <h4 className="text-white font-semibold mb-2">Handover & Support</h4>
                <p className="text-gray-300 text-sm">All source code, simple instructions, 30 days free support</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="platforms" title="Available on Your Favorite Platforms">
          <div className="max-w-5xl mx-auto space-y-16">
            <FiverrPricing />
            <UpworkPricing />
          </div>
        </Section>

        <Section id="faq" title="Frequently Asked Questions">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">What if I don&apos;t like the result?</h3>
                <p className="text-gray-300">Full refund if the automation doesn&apos;t work exactly as promised. Plus you keep any code I&apos;ve written.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">How is this different from Zapier or other tools?</h3>
                <p className="text-gray-300">I write custom code that you own forever. No monthly subscriptions, no limitations, faster performance, and it won&apos;t break when platforms change.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">What if you disappear or stop supporting it?</h3>
                <p className="text-gray-300">You get all the source code. Any developer can maintain it, or I can train someone on your team. You&apos;re never locked in.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">How do I know if my business needs automation?</h3>
                <p className="text-gray-300">If you spend more than 30 minutes daily on repetitive computer tasks (email sorting, data entry, answering the same questions), automation typically pays for itself within a month.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">Do you work with big companies?</h3>
                <p className="text-gray-300">I specialize in small businesses and solopreneurs. Big companies have different needs - I focus on solutions that work perfectly for smaller teams.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="contact" title="Let&apos;s build your AI-powered solution">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-lg text-gray-300 mb-8">
              Click the chat button in the bottom right to get a personalized recommendation and pricing for your project. It&apos;s like talking to me directly!
            </p>
            <div className="bg-zinc-800/50 p-8 rounded-xl border border-zinc-700">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Ready to automate your business?</h3>
              <p className="text-gray-300 mb-6">
                My AI assistant will ask about your business needs and provide instant pricing. No forms to fill out!
              </p>
              <div className="text-sm text-gray-400">
                <div className="text-sm text-gray-400">
                💡 This chatbot uses the same AI technology I&apos;ll build for your business automation
              </div>
              </div>
            </div>
          </div>
        </Section>
        <Footer />
        <Chatbot />
      </div>
    </div>
  );
}
