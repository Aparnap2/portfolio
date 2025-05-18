'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiGithub, FiTerminal, FiCpu, FiCodesandbox } from 'react-icons/fi';
import { FaLinkedin, FaTwitter } from 'react-icons/fa';
import Chatbot from './component/chatbot/chatbot';
import { Footer } from '../app/component/footer';
import CircuitGrid from './component/chatbot/ModernGridBackground'; 
import { projects } from './projects';
import me from './public/images/me.jpeg';

// Simplified, client-focused services
const SERVICES = [
  {
    title: 'AI-Powered Web Apps',
    description: 'Custom web solutions with AI to boost efficiency and engagement.',
    icon: <FiTerminal />,
  },
  {
    title: 'Smart Mobile Apps',
    description: 'AI-driven mobile apps for real-time, scalable features.',
    icon: <FiCodesandbox />,
  },
  {
    title: 'Industry-Specific AI',
    description: 'Tailored AI tools for healthcare, finance, and more.',
    icon: <FiCpu />,
  },
];

// Updated projects with concise, impactful descriptions
const PROJECTS = [
  {
    title: 'Medical Imaging Analyzer',
    description: 'React Native app with TensorFlow Lite for 94% accurate MRI analysis on-device.',
    stack: ['React Native', 'TF Lite', 'DICOM SDK'],
    image: '/images/medical-ai.jpg',
    link: '#',
  },
  {
    title: 'Enterprise RAG System',
    description: 'Next.js platform with Pinecone for 50M+ document search, 60% faster retrieval.',
    stack: ['Next.js', 'Pinecone', 'LlamaIndex'],
    image: '/images/rag-system.jpg',
    link: '#',
  },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [showSocialDropdown, setShowSocialDropdown] = useState(false);
  const totalAssets = PROJECTS.length;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = () => {
    setLoadedAssets(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="relative w-48 h-48">
          {/* Glowing loader circle */}
          <div className="absolute inset-0 rounded-full border-4 border-accent1/30 animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="gradient-text text-xl font-bold">
              Loading {Math.min((loadedAssets / totalAssets) * 100, 100).toFixed(0)}%
            </span>
          </div>
          {/* Subtle glowing pulse */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-accent1 to-accent2 animate-ping opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text">
      <CircuitGrid  active={true} />

      <nav className="fixed w-full z-50 backdrop-blur-md border-b border-secondary/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent1 animate-pulse-slow" />
            <span className="font-spaceGrotesk">Aparna_Pradhan.Dev</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://aparnap2.github.io/Aparna-Pradhan-blogs/"
              className="nav-link hover:text-accent2 transition-colors"
            >
              Blog
            </a>
            <a
              href="https://github.com/aparnap2"
              target="_blank"
              className="nav-link hover:text-accent2 transition-colors"
            >
              <FiGithub className="w-6 h-6" aria-label="GitHub Profile" />
            </a>
          </div>
        </div>
      </nav>

      <section className="min-h-screen pt-32 pb-20 flex items-center relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent1/20 to-accent2/20 blur-2xl animate-float" />
            <Image 
              src={me} 
              alt="Aparna Pradhan - AI-Driven Developer" 
              className="w-48 h-48 rounded-full object-cover transition-transform duration-300 hover:scale-110" 
              priority 
            />
          </div>
          <div className="space-y-6 text-center md:text-left">
            <h1 className="text-5xl font-bold leading-tight">
              <span className="gradient-text font-spaceGrotesk">
                Transform Your Business with AI
              </span>
            </h1>
            <p className="text-xl text-text/80 font-firaCode leading-relaxed">
              I&apos;m <span className="text-accent2 font-bold">Aparna</span>, a{' '}
              <span className="text-accent2 font-bold">full-stack developer</span> delivering custom{' '}
              <span className="text-accent2 font-bold">AI solutions</span> to solve your toughest challenges—fast.
            </p>
            {/* Buttons */}
            <div className="flex gap-4 justify-center md:justify-start">
              <a
                href="#contact"
                className="cta-primary bg-accent1 hover:bg-accent1/80 text-zinc-800 px-6 py-3 rounded-lg transition-all font-semibold"
              >
                Hire Me Now
              </a>
              <a
                href="#projects"
                className="cta-primary bg-transparent border border-accent1 hover:bg-accent1/20 text-accent1 px-6 py-3 rounded-lg transition-all font-semibold"
              >
                View Projects
              </a>
            </div>
            {/* Badge and Social Links */}
            <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
              <div className="flex space-x-4 relative">
                {/* Badge with glowing bubble */}
                <div className="relative">
                  <span className="px-3 py-1 bg-green-500 text-black rounded-full text-sm font-medium">
                    Open to Work
                  </span>
                  <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                </div>
                <div className="relative">
                  <span className="px-3 py-1 bg-accent2 text-black rounded-full text-sm font-medium">
                    Active on Projects
                  </span>
                  <span className="absolute -top-2 -right-2 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowSocialDropdown(prev => !prev)}
                  className="px-4 py-2 bg-inherit text-gray-100 rounded-md flex items-center gap-1 focus:outline-none  transition-colors"
                >
                  Social Links 
                  <svg
                    className={`w-4 h-4 transform transition-transform duration-200 ${showSocialDropdown ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSocialDropdown && (
                  <div className="absolute right-0 mt-2 font-bold bg-accent1 border border-gray-900 rounded-md shadow-lg py-2 z-30">
                    <a
                      href="https://github.com/aparnap2"
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FiGithub className="w-4 h-4" />
                      GitHub
                    </a>
                    <a
                      href="https://www.linkedin.com/in/aparna-pradhan-06b882215/"
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FaLinkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                    <a
                      href="https://x.com/Aparna_108_dev"
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FaTwitter className="w-4 h-4" />
                      Twitter
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 bg-secondary/5 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold font-spaceGrotesk mb-12 text-center gradient-text">
            What I Can Do for You
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map((service, i) => (
              <div
                key={i}
                className="bg-secondary/10 backdrop-blur-sm p-6 rounded-2xl border border-accent1/20 hover:border-accent2/40 transition-all"
              >
                <div className="text-accent1 mb-4 text-3xl">{service.icon}</div>
                <h3 className="text-xl font-semibold mb-2 gradient-text">
                  {service.title}
                </h3>
                <p className="text-text/80 mb-4">{service.description}</p>
                <a
                  href="#contact"
                  className="text-accent1 hover:text-accent2 text-sm font-semibold"
                >
                  Get Started →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="projects" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-spaceGrotesk font-bold mb-12 text-center gradient-text">
            Projects That Deliver Results
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div
                key={project.title}
                className="group relative bg-secondary/10 backdrop-blur-sm rounded-2xl p-6 border border-accent1/20 hover:border-accent2/40 transition-all"
              >
                <div className="relative h-60 rounded-xl overflow-hidden mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br from-accent1/10 to-accent2/10 animate-pulse ${project.image ? 'hidden' : ''}`} />
                  {project.imageUrl && (
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      className="object-cover transition-opacity duration-500"
                      onLoad={handleImageLoad}
                      priority
                    />
                  )}
                </div>
                <h3 className="text-2xl font-semibold mb-2 gradient-text">
                  {project.title}
                </h3>
                <p className="text-text/80 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-accent1/10 text-accent1 border border-accent1/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-600 rounded-lg hover:shadow-lg hover:scale-105 transition-all"
                >
                  See It Live
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 bg-secondary/5 relative z-10">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 gradient-text">
            Ready to Boost Your Business?
          </h2>
          <p className="text-xl text-text/80 mb-8">
            Let’s turn your ideas into reality with AI-driven solutions.
          </p>
          <a
            href="mailto:softservicesinc.portfolio@gmail.com"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-accent2 hover:bg-accent1/80 rounded-lg transition-all"
          >
            Contact Me Today
          </a>
        </div>
      <Footer />
      </section>

      <Chatbot />
    </div>
  );
}
