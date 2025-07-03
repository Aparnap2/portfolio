"use client";
import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCode, FiServer, FiDatabase, FiMail, FiMapPin, FiGithub, FiLinkedin, FiTwitter, FiMenu, FiX } from 'react-icons/fi';
import { FaRobot, FaBrain, FaMobileAlt, FaReact, FaNode, FaPython, FaAws } from 'react-icons/fa';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Footer } from './component/footer';
import me from './public/images/me.jpeg';

import { projects } from './projects';
import { firaCode, spaceGrotesk } from './fonts';
import SectionTitle from './component/SectionTitle';

// Animated Background Component
const AnimatedBackground = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* Dim overlay for readability */}
      <div className="absolute inset-0 bg-slate-900/70 z-10 pointer-events-none"></div>
      {/* Base color */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800"></div>

      {/* Animated orbs with responsive sizing and higher opacity */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-[50vw] md:w-[40vw] lg:w-[30vw] aspect-square bg-gradient-to-r from-purple-500/70 to-pink-500/70 rounded-full mix-blend-screen filter blur-xl"
          animate={prefersReducedMotion ? {} : {
            x: ['-10vw', '10vw', '-10vw'],
            y: ['-10vh', '10vh', '-10vh'],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[60vw] md:w-[45vw] lg:w-[35vw] aspect-square bg-gradient-to-r from-blue-500/70 to-cyan-500/70 rounded-full mix-blend-screen filter blur-xl"
          animate={prefersReducedMotion ? {} : {
            x: ['10vw', '-10vw', '10vw'],
            y: ['10vh', '-10vh', '10vh'],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '60%', right: '10%' }}
        />
        <motion.div
          className="absolute w-[40vw] md:w-[30vw] lg:w-[25vw] aspect-square bg-gradient-to-r from-orange-500/70 to-yellow-500/70 rounded-full mix-blend-screen filter blur-xl"
          animate={prefersReducedMotion ? {} : {
            x: ['0vw', '15vw', '0vw'],
            y: ['0vh', '-15vh', '0vh'],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ bottom: '10%', left: '30%' }}
        />
      </div>

      {/* Grid overlay with responsive sizing */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:25px_25px] sm:bg-[size:35px_35px] md:bg-[size:50px_50px]"></div>
    </div>
  );
};

// Loading Component
const LoadingScreen = () => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.75) 0%, rgba(236,72,153,0.75) 100%)',
      // This is a purple-to-pink gradient with 75% opacity
      backdropFilter: 'blur(4px)',
    }}
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="text-center">
      <motion.div
        className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-t-transparent"
        style={{
          borderColor: 'rgba(236,72,153,0.8) rgba(139,92,246,0.8) rgba(139,92,246,0.8) rgba(236,72,153,0.8)',
          borderTopColor: 'transparent',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.p
        className="text-lg font-medium bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      >
        Loading Portfolio...
      </motion.p>
    </div>
  </motion.div>
);

// Navbar Component
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Update active section based on scroll position
      const sections = ['home', 'about', 'services', 'expertise', 'projects', 'pricing', 'contact'];
      const scrollPosition = window.scrollY + window.innerHeight / 3;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && scrollPosition >= element.offsetTop && 
            scrollPosition < element.offsetTop + element.offsetHeight) {
          setActiveSection(section);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Expertise', href: '#expertise' },
    { name: 'Projects', href: '#projects' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' }
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-900/80 backdrop-blur-lg border-b border-slate-800/50' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.a
            href="#home"
            className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
            onClick={(e) => scrollToSection(e, '#home')}
          >
            Aparna.dev
          </motion.a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                className={`text-sm lg:text-base transition-colors relative group ${
                  activeSection === item.href.substring(1) 
                    ? 'text-white font-medium' 
                    : 'text-gray-300 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                onClick={(e) => scrollToSection(e, item.href)}
              >
                {item.name}
                <span 
                  className={`absolute -bottom-1 left-0 h-0.5 bg-purple-500 transition-all duration-300 ${
                    activeSection === item.href.substring(1) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                ></span>
              </motion.a>
            ))}
            <motion.a
              href="#contact"
              className="px-4 py-1.5 sm:px-6 sm:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm lg:text-base rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => scrollToSection(e, '#contact')}
            >
              Hire Me
            </motion.a>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-300 hover:text-white p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800/50 shadow-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-4 space-y-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`block transition-colors ${
                      activeSection === item.href.substring(1)
                        ? 'text-white font-medium'
                        : 'text-gray-300 hover:text-white'
                    }`}
                    onClick={(e) => scrollToSection(e, item.href)}
                  >
                    {item.name}
                  </a>
                ))}
                <a
                  href="#contact"
                  className="block w-full text-center px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full"
                  onClick={(e) => scrollToSection(e, '#contact')}
                >
                  Hire Me
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              <span className="text-white">Solutions</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              I build intelligent applications that transform businesses through cutting-edge AI integration and modern web technologies.
            </p>
          </motion.div>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.a
              href="#contact"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your Project
            </motion.a>
            <motion.a
              href="#projects"
              className="px-8 py-4 border-2 border-purple-500 text-purple-400 rounded-full text-lg font-semibold hover:bg-purple-500/10 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View My Work
            </motion.a>
          </motion.div>
          <motion.div
            className="flex justify-center items-center space-x-8 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex items-center space-x-2">
              <FaReact className="text-2xl text-cyan-400" />
              <span>React</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaNode className="text-2xl text-green-400" />
              <span>Node.js</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaPython className="text-2xl text-yellow-400" />
              <span>Python</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaRobot className="text-2xl text-purple-400" />
              <span>AI/ML</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// About Section
const AboutSection = () => {
  return (
    <section id="about" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <SectionTitle
              title="About Me"
              subtitle="I'm Aparna Pradhan, a full-stack web and React Native developer deeply focused on building AI-integrated, niche-specific solutions — from automation and chatbots to SaaS tools and research systems."
            />
            <p className="text-lg text-gray-300 mb-6">
              I&#39;m Aparna Pradhan, a full-stack web and React Native developer deeply focused on building AI-integrated, niche-specific solutions — from automation and chatbots to SaaS tools and research systems. I specialize in RAG, vector/graph DBs, LangChain, LangGraph, and memory-aware generation workflows.
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Based in West Bengal, India, I build modern, efficient AI-first applications that solve real-world problems for solopreneurs, SaaS startups, and small businesses. From agentic platforms to WhatsApp automation — I turn AI into leverage.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm">AI + Fullstack Expert</span>
              <span className="px-4 py-2 bg-pink-500/20 text-pink-300 rounded-full text-sm">Custom Agent Architect</span>
              <span className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-full text-sm">Next.js | Expo | LangChain</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="w-full max-w-md mx-auto">
              <div className="relative w-80 h-80 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <Image
                    src={me}
                    alt="Aparna Pradhan"
                    fill
                    className="object-cover rounded-full shadow-lg"
                    priority
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Services Section
const ServicesSection = () => {
  const services = [
    {
      icon: <FiCode className="w-8 h-8" />,
      title: "Full-Stack Development",
      description: "End-to-end web applications with modern technologies like React, Next.js, and Node.js",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FaRobot className="w-8 h-8" />,
      title: "AI Integration",
      description: "Seamlessly integrate AI capabilities into your applications with LLMs, machine learning, and automation",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaMobileAlt className="w-8 h-8" />,
      title: "Mobile Development",
      description: "Cross-platform mobile applications with React Native and modern mobile technologies",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <FiServer className="w-8 h-8" />,
      title: "Backend Development",
      description: "Scalable server-side solutions with APIs, databases, and cloud infrastructure",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <FaBrain className="w-8 h-8" />,
      title: "AI Consulting",
      description: "Strategic guidance on AI adoption and implementation for your business needs",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: <FiDatabase className="w-8 h-8" />,
      title: "Data Solutions",
      description: "Database design, data analytics, and business intelligence solutions",
      color: "from-teal-500 to-blue-500"
    }
  ];

  return (
    <section id="services" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            My <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            I offer comprehensive solutions to help your business leverage modern technology and AI
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className="h-full p-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${service.color} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-gray-300 leading-relaxed">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Expertise Section from the second snippet with enhancements
const ExpertiseSection = () => {
  const expertise = [
    {
      title: "Full-Stack Development",
      description: "End-to-end web development with modern technologies and best practices.",
      color: "from-orange-900/30 to-orange-800/10",
      icon: <FiCode className="w-6 h-6 text-orange-400" />,
      techs: ["Next.js", "React", "Node.js", "MongoDB", "PostgreSQL", "Prisma", "Redis", "TailwindCSS", "ShadcnUI", "Stripe", "NextAuth", "JWT", "Clerk", "Upstash", "graphql"]
    },
    {
      title: "Mobile Development",
      description: "Building cross-platform mobile applications with React Native.",
      color: "from-blue-900/30 to-blue-800/10",
      icon: <FaMobileAlt className="w-6 h-6 text-blue-400" />,
      techs: ["Expo", "nativewind", "zustand", "Firebase / appwrite / supabase / custom", "Push Notifications", "Offline First"]
    },
    {
      title: "AI Integration",
      description: "Seamlessly integrating AI capabilities into existing applications.",
      color: "from-green-900/30 to-green-800/10",
      icon: <FaRobot className="w-6 h-6 text-green-400" />,
      techs: ["LLM API", "LangChain", "Vector DBs", "third party APIs", "AI agents", "workflow automation"]
    },
    {
      title: "Backend Development",
      description: "Scalable and efficient server-side solutions for your applications.",
      color: "from-red-900/30 to-red-800/10",
      icon: <FiServer className="w-6 h-6 text-red-400" />,
      techs: ["Node.js", "Express", "Django", "FastAPI", "MongoDB", "PostgreSQL"]
    }
  ];

  return (
    <section id="expertise" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="My Expertise"
          subtitle="I specialize in creating intelligent solutions that drive growth and efficiency for your business."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {expertise.map((item, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 group`}
              whileHover={{ y: -5, scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className={`text-xl font-bold text-white mb-3 ${spaceGrotesk.className}`}>{item.title}</h3>
              <p className="text-gray-400 mb-4">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                {item.techs.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-800/50 text-gray-200 text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Utility section component from the second snippet
const Section = ({ id, title, children, subtitle }) => (
  <section id={id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
    <SectionTitle title={title} subtitle={subtitle} />
    {children}
  </section>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusColors = {
    'production': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'beta': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'development': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'archived': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'default': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };
  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    return statusColors[statusLower] || statusColors.default;
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Metric Card Component
const MetricCard = ({ value, label }) => (
  <div className="glass p-4 rounded-xl border border-zinc-700/50 hover:border-orange-500/30 transition-colors">
    <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent text-shadow">
      {value}
    </p>
    <p className="text-xs text-gray-400 mt-1 text-shadow">{label}</p>
  </div>
);

// Project Card Component from the second snippet with enhancements
const ProjectCard = ({ project, index }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: Math.min(index * 0.05, 0.3),
      }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className="group relative glass rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300"
    >
      <div className="p-6 md:p-8">
        {/* Header with title and status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              {project.icon && (
                <span className="text-2xl">
                  {project.icon}
                </span>
              )}
              <div>
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {project.title}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={project.status} />
                  {project.timeline && (
                    <span className="text-xs text-gray-400">
                      {project.timeline}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3">
            {project.githubUrl && (
              <a
                key="github"
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.337-3.369-1.337-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.293 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path>
                </svg>
                <span className="truncate">View Code</span>
              </a>
            )}
            {project.liveUrl && project.status.toLowerCase() === 'production' && (
              <a
                key="demo"
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-orange-600 to-pink-600 hover:opacity-90 text-white rounded-lg font-medium transition-opacity text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span className="truncate">Live Demo</span>
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Image and Tech Stack */}
          <div className="w-full lg:w-2/5">
            <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-zinc-700/50 group-hover:border-orange-500/50 transition-colors bg-gradient-to-br from-zinc-800 to-zinc-900">
              <Image
                src={project.image}
                alt={project.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                className={`object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoadingComplete={() => setIsImageLoaded(true)}
                priority={index < 2}
                loading={index >= 2 ? 'lazy' : 'eager'}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse"></div>
              )}
            </div>
            {/* Tech Stack Section */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">TECH STACK</h3>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1.5 glass text-gray-200 rounded-full border border-zinc-700/50 hover:border-orange-500/50 transition-colors text-shadow"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            {/* Metrics Grid */}
            {project.metrics && project.metrics.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">KEY METRICS</h3>
                <div className="grid grid-cols-2 gap-3">
                  {project.metrics.map((metric, idx) => (
                    <MetricCard key={idx} value={metric.value} label={metric.label} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Content */}
          <div className="flex-1">
            {/* Project Description */}
            <div className="mb-6">
              <p className="text-gray-300 leading-relaxed">
                {project.description}
              </p>
            </div>
            {/* Challenge & Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/50 group hover:border-orange-500/30 transition-colors">
                <h4 className="text-sm font-semibold text-orange-400 mb-2">
                  The Challenge
                </h4>
                <p className="text-sm text-gray-300">
                  {project.problem}
                </p>
              </div>
              <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/50 group hover:border-green-500/30 transition-colors">
               
                <h4 className="text-sm font-semibold text-green-400 mb-2">
                  The Solution
                </h4>
                <p className="text-sm text-gray-300">
                  {project.solution}
                </p>
              </div>
            </div>

            {/* Key Results & Impact */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                Key Results & Impact
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.results.map((result, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-emerald-400 mr-2 mt-0.5">✓</span>
                    <span className="text-sm text-gray-300">{result}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Challenges */}
            {project.challenges && project.challenges.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                  Challenges Overcome
                </h4>
                <div className="space-y-3">
                  {project.challenges.map((challenge, i) => (
                    <div key={i} className="flex items-start">
                      <span className="text-amber-400 mr-2 mt-0.5">•</span>
                      <span className="text-sm text-gray-300">{challenge}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team & Role */}
            {(project.role || project.teamSize) && (
              <div className="mt-6 pt-4 border-t border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {project.role && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-400 mb-1">MY ROLE</h5>
                      <p className="text-sm text-gray-300">{project.role}</p>
                    </div>
                  )}
                  {project.teamSize && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-400 mb-1">TEAM SIZE</h5>
                      <p className="text-sm text-gray-300">{project.teamSize}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Projects Section
const ProjectsSection = () => {
  return (
    <Section id="projects" title="Featured Projects" subtitle="Showcasing some of my recent work in AI integration and modern web development">
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
      </div>
    </Section>
  );
};

// Pricing Section
const PricingSection = () => {
  const [activeTab, setActiveTab] = useState('fiverr');

  // Dynamically import pricing components with no SSR
  const FiverrPricing = dynamic(
    () => import('./component/pricing/FiverrPricing').then(mod => mod.FiverrPricing),
    { ssr: false }
  );

  const UpworkPricing = dynamic(
    () => import('./component/pricing/UpworkPricing').then(mod => mod.UpworkPricing),
    { ssr: false }
  );

  return (
    <section id="pricing" className="py-16 sm:py-24">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <SectionTitle
          title="Pricing & Services"
          subtitle="Choose the perfect plan that fits your needs. Whether you prefer fixed-price projects or hourly contracts, I&#39;ve got you covered."
        />

        <div className="mb-8">
          <p className="text-gray-400 text-center">
            The pricing shown is for reference. Each project is unique, and I&apos;m happy to tailor my services to your specific needs and budget.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex space-x-1">
            <button
              onClick={() => setActiveTab('fiverr')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'fiverr' ? 'text-orange-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              Fiverr Services
            </button>
            <button
              onClick={() => setActiveTab('upwork')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'upwork' ? 'text-green-500' : 'text-gray-400 hover:text-white'
              }`}
            >
              Upwork Services
            </button>
          </div>
        </div>

        <div className="relative min-h-[800px]">
          <div
            key="fiverr"
            className={`transition-opacity duration-300 ${activeTab === 'fiverr' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
          >
            <FiverrPricing />
          </div>

          <div
            key="upwork"
            className={`transition-opacity duration-300 ${activeTab === 'upwork' ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
          >
            <UpworkPricing />
          </div>
        </div>
      </div>
    </section>
  );
};

// Contact Section
const ContactSection = () => {
  return (
    <section id="contact" className="relative pt-20 pb-32 sm:pt-24 sm:pb-40 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>
            Ready to Transform Your Business with AI?
          </h2>
          <p className={`text-lg text-gray-300 max-w-2xl mx-auto ${firaCode.className}`}>
            I&#39;m here to help you navigate the world of AI and build solutions that make an impact.
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className={`text-2xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>Get in Touch</h3>
              <p className="text-gray-300 mb-6">
                Have a project in mind or want to discuss how AI can benefit your business?
                I&#39;m here to help you navigate the world of AI and build solutions that make an impact.
              </p>

              <div className="space-y-4 mb-6">
                <a
                  href="mailto:softservicesinc.portfolio@gmail.com"
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <FiMail className="w-5 h-5 mr-3 text-orange-400" />
                  softservicesinc.portfolio@gmail.com
                </a>
                <a
                  href="https://goo.gl/maps/SQUjHtzSMfeZfmWR7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <FiMapPin className="w-5 h-5 mr-3 text-orange-400" />
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
                    <FiLinkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="https://x.com/Aparna_108_dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-400 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <FiTwitter className="w-5 h-5" />
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
                <FiMail className="w-5 h-5 mr-2" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Import enhanced UI components
import ProgressHeader from './component/navigation/ProgressHeader';
import FloatingNavigation from './component/ui/FloatingNavigation';
import ScrollProgress from './component/ui/ScrollProgress';
import EnhancedLoader from './component/loading/EnhancedLoader';
import ImprovedProjectsSection from './component/projects/ImprovedProjectsSection';
import SectionDivider from './component/ui/SectionDivider';

// Main App Component
export default function ModernPortfolio() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <EnhancedLoader key="loader" />
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen text-white"
          >
            <AnimatedBackground />
            <ProgressHeader />
            <FloatingNavigation />
            <ScrollProgress />

            <main className="px-4 sm:px-6 lg:px-8">
              <HeroSection />
              <SectionDivider accent="blue" />
              <AboutSection />
              <SectionDivider accent="green" />
              <ServicesSection />
              <SectionDivider accent="purple" />
              <ExpertiseSection />
              <ImprovedProjectsSection />
              <SectionDivider accent="orange" />
              <PricingSection />
              <SectionDivider />
              <ContactSection />
            </main>

            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

