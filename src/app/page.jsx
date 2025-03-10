'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiGithub, FiTerminal, FiCpu, FiCodesandbox } from 'react-icons/fi';
import Chatbot from './component/chatbot/chatbot';
import { Footer } from '../app/component/footer';
import QuantumBackground from './component/chatbot/QuantumBackground';
import { projects } from './projects';
import me from './public/images/me.jpeg';
import ReactMarkdown from 'react-markdown';

const AI_FEATURES = [
  {
    title: 'Production-Grade LLM API Integration',
    icon: <FiTerminal />,
    description: 'Seamless integration of large language models into production environments for real-time, scalable AI solutions.',
    tech: ['OpenAI', 'Hugging Face', 'LangChain']
  },
  {
    title: 'RAG Pipeline',
    icon: <FiCpu />,
    description: 'Retrieval-Augmented Generation pipelines for enhanced AI-driven document search and content generation.',
    tech: ['Pinecone', 'LlamaIndex', 'Weaviate']
  },
  {
    title: 'Prompt Engineering',
    icon: <FiCodesandbox />,
    description: 'Crafting effective prompts to optimize AI model performance and ensure high-quality outputs.',
    tech: ['Prompt Engineering', 'Chain of Thought', 'Few-Shot Learning']
  },
  {
    title: 'AI Agent',
    icon: <FiCpu />,
    description: 'Development of autonomous AI agents capable of performing complex tasks and decision-making.',
    tech: ['LangGraph', 'AutoGPT', 'BabyAGI']
  },
  {
    title: 'LangGraph',
    icon: <FiTerminal />,
    description: 'Utilizing LangGraph for building and managing complex AI workflows and multi-step processes.',
    tech: ['LangGraph', 'LangChain', 'Graph-Based AI']
  },
  {
    title: 'TensorFlow.js',
    icon: <FiCodesandbox />,
    description: 'Leveraging TensorFlow.js for real-time AI inference in web applications, enabling on-the-fly machine learning.',
    tech: ['TF.js', 'WebGL', 'Web Workers']
  },
  {
    title: 'TensorFlow Lite',
    icon: <FiCpu />,
    description: 'Optimizing AI models for mobile deployment with TensorFlow Lite, ensuring performance and efficiency on edge devices.',
    tech: ['TF Lite', 'CoreML', 'Metal Performance Shaders']
  }
];

const PROJECTS = [
  {
    title: 'Medical Imaging Analyzer - AI-Powered Diagnostics App',
    content: 'Edge-deployed CNN models for MRI analysis with 94% accuracy',
    stack: ['React Native', 'TF Lite', 'DICOM SDK'],
    image: '/images/medical-ai.jpg',
    link: '#',
    description: 'A React Native mobile application leveraging TensorFlow Lite for on-device medical image analysis. This AI-powered tool assists healthcare professionals in preliminary MRI analysis, achieving 94% accuracy in detecting anomalies. Built with React Native for cross-platform deployment and optimized with TF Lite for efficient edge inference. DICOM SDK integration ensures compatibility with medical imaging standards.'
  },
  {
    title: 'Enterprise RAG System - Intelligent Document Search Platform',
    content: 'Vector search pipeline handling 50M+ documents',
    stack: ['Next.js', 'Pinecone', 'LlamaIndex', 'AWS Inferentia'],
    image: '/images/rag-system.jpg',
    link: '#',
    description: 'A scalable enterprise-grade Retrieval-Augmented Generation (RAG) system built with Next.js for the frontend and a robust backend powered by Pinecone for vector search and LlamaIndex for data indexing and retrieval. Deployed on AWS Inferentia for cost-effective AI inference. This full-stack solution enables intelligent document search and question answering over 50M+ documents, improving information access and knowledge management within large organizations.'
  }
];

const SERVICES = [
  {
    title: 'Custom AI Web Solutions',
    description: 'Tailored web applications with AI integration for unique business needs. From predictive analytics to personalized user experiences, we design solutions that static SaaS platforms can\'t provide.',
    icon: <FiTerminal />
  },
  {
    title: 'AI-Enhanced Mobile Apps',
    description: 'Leveraging AI to create mobile applications that offer advanced functionalities like real-time image recognition, natural language processing, and more. Our solutions are built for performance and scalability.',
    icon: <FiCodesandbox />
  },
  {
    title: 'Niche-Specific AI Solutions',
    description: 'Specialized AI solutions for specific industries or use cases. Whether it\'s medical diagnostics, financial forecasting, or custom data analysis, we provide bespoke solutions that align perfectly with your business goals.',
    icon: <FiCpu />
  }
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const totalAssets = projects.length;

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
          <div className="absolute inset-0 bg-gradient-to-r from-accent1 to-accent2 rounded-full animate-pulse blur-xl opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-accent1/30 rounded-full animate-spin-slow">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-accent1/20 to-transparent" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="gradient-text text-xl font-bold">
              Loading {Math.min((loadedAssets / totalAssets) * 100, 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary text-text">
      <QuantumBackground active={true} />

      <nav className="fixed w-full z-50 backdrop-blur-md border-b border-secondary/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent1 animate-pulse-slow" />
            <span className="font-mono">Aparna_Pradhan.Dev</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://aparnap2.github.io/Aparna-Pradhan-blogs/" className="nav-link hover:text-accent2 transition-colors">Blog</a>
            <a href="https://github.com/aparnap2" target="_blank" className="nav-link hover:text-accent2 transition-colors">
              <FiGithub className="w-6 h-6" aria-label="GitHub Profile" />
            </a>
          </div>
        </div>
      </nav>

      <section className="min-h-screen pt-32 pb-20 flex items-center relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent1/20 to-accent2/20 blur-2xl animate-float" />
            <div className="flex items-center justify-center h-full">
              <Image 
                src={me} 
                alt="Aparna Pradhan - Full-Stack Web and React Native Developer specializing in AI Integration" 
                className="w-48 h-48 rounded-full object-cover transition-transform duration-300 hover:scale-110" 
                priority 
              />
            </div>
          </div>
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              <span className="gradient-text">AI-Powered Web & App [ expo ] Development</span>
             
            </h1>
            <p className="text-xl text-text/80 font-mono">
              Specializing in AI Integration to deliver tailored solutions beyond static SaaS capabilities.
            </p>
            <div className="flex gap-4">
              <a href="#services" className="cta-primary bg-accent1/10 hover:bg-accent1/20 border border-accent1/30 px-6 py-3 rounded-lg transition-all">
                Discover My Services
              </a>
              <a href="#work" className="cta-primary bg-accent1/10 hover:bg-accent1/20 border border-accent1/30 px-6 py-3 rounded-lg transition-all">
                Explore My AI-Driven Projects
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 bg-secondary/5 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center gradient-text">Tailored AI Services for Your Unique Needs</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map((service, i) => (
              <div
                key={i}
                className="bg-secondary/10 backdrop-blur-sm p-8 rounded-2xl border border-accent1/20 hover:border-accent2/40 transition-all"
              >
                <div className="text-accent1 mb-4 text-3xl">{service.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 gradient-text">{service.title}</h3>
                <p className="text-text/80 mb-4">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/5 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center gradient-text">Advanced AI Integration Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {AI_FEATURES.map((feature, i) => (
              <div
                key={i}
                className="bg-secondary/10 backdrop-blur-sm p-8 rounded-2xl border border-accent1/20 hover:border-accent2/40 transition-all"
              >
                <div className="text-accent1 mb-4 text-3xl">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 gradient-text">{feature.title}</h3>
                <p className="text-text/80 mb-4">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.tech.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-accent1/10 text-accent1 border border-accent1/20"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 gradient-text">AI-Driven Project Portfolio - Niche-Specific Custom Solutions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative bg-secondary/10 backdrop-blur-sm rounded-2xl p-6 border border-accent1/20 hover:border-accent2/40 transition-all"
              >
                <div className="relative h-60 rounded-xl overflow-hidden mb-6">
                  <div className={`absolute inset-0 bg-gradient-to-br from-accent1/10 to-accent2/10 animate-pulse ${project.imageUrl ? 'hidden' : ''}`} />
                  {project.imageUrl && (
                    <Image
                      src={project.imageUrl}
                      alt={project.title}
                      fill
                      className="object-cover transition-opacity duration-500"
                      onLoadingComplete={handleImageLoad}
                      priority
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
                </div>
                <div className="text-accent1 font-mono mb-2">AI/{project.title.split(' ')[0]}</div>
                <h3 className="text-2xl font-semibold mb-4 gradient-text">{project.title}</h3>
                <p className="text-text/80 mb-6">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-accent1/10 text-accent1 border border-accent1/20 hover:bg-accent2/20 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/80 backdrop-blur-sm flex items-center justify-center text-accent2 text-lg font-semibold"
                >
                  View Repository →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Chatbot />
      <Footer />
    </div>
  );
}