// app/page.jsx
'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiGithub, FiTerminal, FiCpu, FiCodesandbox } from 'react-icons/fi';
import Chatbot from './component/chatbot/chatbot';
import QuantumBackground from './component/chatbot/QuantumBackground';
import { projects } from './projects';
import me from './public/images/me.jpeg'
const AI_FEATURES = [
  {
    title: 'TensorFlow.js Integration',
    icon: <FiTerminal />,
    description: 'Real-time inference pipelines with WebGL acceleration',
    tech: ['TF.js 3.8', 'WebAssembly', 'Web Workers']
  },
  {
    title: 'LLM Fine-Tuning',
    icon: <FiCpu />,
    description: 'Domain-specific model optimization with LoRA adapters',
    tech: ['Hugging Face', 'PyTorch', 'QLoRA']
  },
  {
    title: 'Mobile AI',
    icon: <FiCodesandbox />,
    description: 'TFLite deployment with React Native bindings',
    tech: ['CoreML', 'ONNX Runtime', 'Metal Performance Shaders']
  }
];

const PROJECTS = [
  {
    title: 'Medical Imaging Analyzer',
    content: 'Edge-deployed CNN models for MRI analysis with 94% accuracy',
    stack: ['React Native', 'TF Lite', 'DICOM SDK'],
    image: '/images/medical-ai.jpg',
    link: '#'
  },
  {
    title: 'Enterprise RAG System',
    content: 'Vector search pipeline handling 50M+ documents',
    stack: ['Next.js', 'Pinecone', 'LlamaIndex', 'AWS Inferentia'],
    image: '/images/rag-system.jpg',
    link: '#'
  }
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const totalAssets = projects.length; // Total images to load

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
              Loading {Math.min(loadedAssets / totalAssets * 100, 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="gradient-text text-xl font-bold">Initializing AI Core...</span>
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
            <span className="font-mono">APARNA.dev</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://aparnap2.github.io/Aparna-Pradhan-blogs/" className="nav-link hover:text-accent2 transition-colors">Blogs</a>
            <a href="https://github.com/aparnap2" target="_blank" className="nav-link hover:text-accent2 transition-colors">
              <FiGithub className="w-6 h-6" />
            </a>
          </div>
        </div>
      </nav>

      <section className="min-h-screen pt-32 pb-20 flex items-center relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent1/20 to-accent2/20 blur-2xl animate-float" />
           
              <div class="flex items-center justify-center h-full">
                <Image src={me} alt="Profile Image" class="w-48 h-48 rounded-full object-cover transition-transform duration-300 hover:scale-110" />
             
            </div>

          </div>

          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              <span className="gradient-text">AI Integration</span> Specialist
              <br />
              Building Intelligent Pipelines
            </h1>
            <p className="text-xl text-text/80 font-mono">
              Full-stack developer bridging neural networks & production systems
            </p>
            <div className="flex gap-4">
              <a href="#work" className="cta-primary bg-accent1/10 hover:bg-accent1/20 border border-accent1/30 px-6 py-3 rounded-lg transition-all">
                View Deployments
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary/5 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center gradient-text">AI Pipeline Architecture</h2>
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
          <h2 className="text-3xl font-bold mb-12 gradient-text">Production Systems</h2>
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
    </div>
  );
}