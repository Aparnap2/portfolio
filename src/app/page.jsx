'use client';
import { useState, useRef, useEffect } from 'react';
import ChatbotContainer from './component/chatbot/chatbot';
import { projects } from './projects';
import { Typewriter } from 'react-simple-typewriter';
import Image from 'next/image';
import me from './public/images/me.jpeg';
import { Footer } from './component/footer';
import Link from 'next/link';
import { FiGithub, FiLinkedin, FiTerminal, FiCpu, FiHexagon, FiServer, FiZap, FiCloud, FiCode } from 'react-icons/fi';

const COLORS = {
  primary: '#0a0a0f',
  secondary: '#1a1a2f',
  accent1: '#00f7ff',
  accent2: '#7d12ff',
  text: '#e0e0f0'
};

const SKILLS = [
  { title: 'TensorFlow.js & TFLite Integration', level: '90%' },
  { title: 'LLM API Development (RAG/Fine-tuning)', level: '85%' },
  { title: 'React Native AI Applications', level: '88%' },
  { title: 'AI-Powered Automation Systems', level: '82%' },
];

const SERVICES = [
  {
    title: 'Custom AI Integration',
    icon: <FiZap />,
    description: 'Seamless integration of TensorFlow.js and TFLite models into web and mobile applications',
    features: ['Model Optimization', 'Real-time Inference', 'Hardware Acceleration']
  },
  {
    title: 'Enterprise Chatbot Development',
    icon: <FiCpu />,
    description: 'LLM-powered chatbots with RAG architecture and fine-tuning capabilities',
    features: ['Conversational AI', 'Knowledge Integration', 'Multi-channel Deployment']
  },
  {
    title: 'Mobile AI Optimization',
    icon: <FiHexagon />,
    description: 'React Native solutions with on-device ML using TFLite and CoreML',
    features: ['Model Quantization', 'Edge Computing', 'Cross-Platform AI']
  }
];


const GeometricBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 opacity-10 bg-[length:40px_40px]" 
         style={{
           backgroundImage: `linear-gradient(to right, ${COLORS.accent1} 1px, transparent 1px),
                            linear-gradient(to bottom, ${COLORS.accent1} 1px, transparent 1px)`
         }} />
    {[...Array(12)].map((_, i) => (
      <div key={i} className="absolute w-24 h-24 opacity-5 animate-float"
           style={{
             left: `${Math.random() * 100}%`,
             top: `${Math.random() * 100}%`,
             backgroundImage: `radial-gradient(circle, ${COLORS.accent2} 20%, transparent 70%)`,
             animationDelay: `${i * 2}s`
           }} />
    ))}
    <div className="absolute inset-0 top-0 h-px bg-gradient-to-r from-transparent via-[${COLORS.accent1}] to-transparent animate-scan" />
  </div>
);

const Section = ({ id, title, children, className }) => (
  <section id={id} className={`w-full max-w-7xl mx-auto px-4 md:px-8 py-20 ${className}`}>
    <div className="flex items-center mb-12 space-x-4 group">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[${COLORS.accent1}] to-transparent opacity-30 transition-opacity group-hover:opacity-70" />
      <h2 className="text-3xl md:text-4xl font-bold text-center" style={{
        background: `linear-gradient(45deg, ${COLORS.accent1}, ${COLORS.accent2})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        animation: 'gradient-shift 8s ease infinite'
      }}>
        {title}
      </h2>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[${COLORS.accent1}] to-transparent opacity-30 transition-opacity group-hover:opacity-70" />
    </div>
    {children}
  </section>
);

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const chatboxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const AboutContent = () => (
    <div className="neon-card">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: COLORS.accent1 }} />
            <h3 className="text-2xl font-semibold" style={{ color: COLORS.text }}>
              AI Integration Specialist
            </h3>
          </div>
          <p className="leading-relaxed" style={{ color: `${COLORS.text}80` }}>
            Specializing in <span style={{ color: COLORS.accent1 }}>neural network integration</span> and 
            <span style={{ color: COLORS.accent2 }}> intelligent system architecture</span>.
            Building AI-enhanced applications with TensorFlow.js, TFLite, and LLM APIs.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="tech-chip">
              <FiCpu style={{ color: COLORS.accent1 }} />
              <span>TF.js Pipelines</span>
            </div>
            <div className="tech-chip">
              <FiZap style={{ color: COLORS.accent1 }} />
              <span>RAG Systems</span>
            </div>
          </div>
        </div>
        <div className="relative group">
          <div className="neon-glow" />
          <Image
            src={me}
            alt="Aparna Pradhan"
            className="w-full h-auto rounded-xl border transition-all"
            style={{ borderColor: `${COLORS.accent1}30` }}
            width={500}
            height={500}
          />
        </div>
      </div>
    </div>
  );

  const SkillsContent = ({ skills }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {skills.map((skill) => (
        <div key={skill.title} className="neon-card">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-medium" style={{ color: COLORS.text }}>{skill.title}</span>
            <span className="text-sm font-medium" style={{ color: COLORS.accent2 }}>{skill.level}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: COLORS.primary }}>
            <div
              className="h-full rounded-full transition-all duration-1000 progress-bar"
              style={{ 
                width: skill.level,
                background: `linear-gradient(90deg, ${COLORS.accent1}, ${COLORS.accent2})`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const ProjectsContent = ({ projects }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {projects.map((project) => (
        <div key={project.id} className="neon-card hover:transform hover:scale-[1.02] transition-all">
          <div className="relative overflow-hidden">
            <Image
              src={project.imageUrl}
              alt={project.title}
              width={400}
              height={300}
              className="w-full h-48 object-cover grayscale group-hover:grayscale-0 transition-all"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[${COLORS.primary}/90] to-transparent" />
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: COLORS.accent1 }} />
              <h3 className="text-xl font-semibold" >{project.title}</h3>
            </div>
            <p className="text-sm text-gray-50 mb-4" >{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span key={tech} className="tech-badge" style={{ 
                  background: `${COLORS.accent2}10`,
                  color: COLORS.accent2
                }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ServicesContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {SERVICES.map((service, index) => (
        <div key={index} className="neon-card hover:transform hover:scale-[1.02] transition-all">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg" style={{
                background: `${COLORS.accent1}20`,
                color: COLORS.accent1
              }}>
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold" style={{ color: COLORS.text }}>
                {service.title}
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: `${COLORS.text}80` }}>
              {service.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {service.features.map((feature, i) => (
                <span key={i} className="px-3 py-1 text-xs rounded-full" 
                      style={{ background: `${COLORS.accent2}20`, color: COLORS.accent2 }}>
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={chatboxRef} style={{ background: COLORS.primary, color: COLORS.text }} 
         className="min-h-screen flex flex-col items-center relative">
      <GeometricBackground />

      <nav className={`w-full fixed top-0 z-50 backdrop-blur-md transition-all ${isScrolled ? 'bg-primary/90 border-b border-accent1/20' : 'bg-transparent'}`}
           style={{ background: isScrolled ? `${COLORS.primary}e6` : 'transparent' }}>
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: COLORS.accent1 }} />
            <h2 className="text-xl font-bold" style={{
              background: `linear-gradient(45deg, ${COLORS.accent1}, ${COLORS.accent2})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              Aparna Pradhan
            </h2>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="#services" className="hover:text-accent1 transition-colors" style={{ color: COLORS.text }}>
              Services
            </Link>
            <Link href="https://aparnap2.github.io/Aparna-Pradhan-blogs/" className="hover:text-accent1 transition-colors" style={{ color: COLORS.text }}>
              Blogs
            </Link>
            <Link href="https://github.com/aparnap2" target="_blank" className="social-link">
              <FiGithub size={20} style={{ color: COLORS.text }} />
            </Link>
            <Link href="https://linkedin.com/in/aparna-pradhan" target="_blank" className="social-link">
              <FiLinkedin size={20} style={{ color: COLORS.text }} />
            </Link>
          </div>
        </div>
      </nav>

      <header className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="relative w-48 h-48 hover:animate-float">
            <div className="absolute inset-0 rounded-full blur-lg opacity-20 animate-pulse"
                 style={{ background: `linear-gradient(45deg, ${COLORS.accent1}, ${COLORS.accent2})` }} />
            <Image
              src={me}
              alt="Aparna Pradhan"
              className="relative rounded-full object-cover w-full h-full border-2 transition-all"
              style={{ borderColor: `${COLORS.accent1}30` }}
              width={192}
              height={192}
            />
          </div>
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-geist-sans md:text-5xl font-bold mb-4" style={{
              background: `linear-gradient(45deg, ${COLORS.accent1}, ${COLORS.accent2})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }}>
              APARNA PRADHAN
            </h1>
            <div className="h-20 mb-6">
              <p className="text-xl md:text-2xl font-medium font-geist-mono" style={{ color: `${COLORS.text}80` }}>
                <Typewriter
                  words={[
                    'Full-Stack AI Developer',
                    'React Native AI Specialist',
                    'LLM Integration Expert',
                    'Intelligent Systems Architect'
                  ]}
                  loop
                  cursor
                  cursorStyle="▌"
                  typeSpeed={70}
                  deleteSpeed={50}
                  delaySpeed={2000}
                />
              </p>
            </div>
           
          </div>
        </div>
      </header>

      <Section id="services" title="// CORE SERVICES">
        <ServicesContent />
      </Section>

      <Section id="about" title="// ARCHITECTURE OVERVIEW">
        <AboutContent />
      </Section>

      <Section id="skills" title="// CORE CAPABILITIES">
        <SkillsContent skills={SKILLS} />
      </Section>

      <Section id="projects" title="// ACTIVE DEPLOYMENTS">
        <ProjectsContent projects={projects} />
      </Section>

      <div className="fixed bottom-8 right-8 z-50">
        <ChatbotContainer />
      </div>

      <Footer />

      <style jsx global>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes scan {
          0% { top: -50px; }
          100% { top: 100%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }

        .neon-card {
          background: ${COLORS.secondary};
          border: 1px solid ${COLORS.accent1}20;
          border-radius: 1rem;
          padding: 2rem;
          transition: all 0.3s ease;
        }

        .neon-card:hover {
          border-color: ${COLORS.accent2}50;
          box-shadow: 0 0 20px ${COLORS.accent1}20;
        }

        .tech-chip {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: ${COLORS.primary};
          border: 1px solid ${COLORS.accent1}20;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
          color: ${COLORS.text};
        }

        .tech-chip:hover {
          border-color: ${COLORS.accent2};
          background: ${COLORS.accent2}10;
        }

        .neon-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .neon-button:hover {
          box-shadow: 0 0 20px ${COLORS.accent1}40;
          transform: translateY(-2px);
        }

        .progress-bar {
          animation: progress-glow 2s ease-in-out infinite;
        }

        @keyframes progress-glow {
          0%, 100% { box-shadow: 0 0 10px ${COLORS.accent1}; }
          50% { box-shadow: 0 0 20px ${COLORS.accent2}; }
        }
      `}</style>
    </div>
  );
}