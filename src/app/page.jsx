'use client';
import { useState } from 'react';
import ChatbotContainer from './component/chatbot/chatbot';
import { projects } from './projects';
import { Typewriter } from 'react-simple-typewriter';
import Image from 'next/image';
import me from './public/images/me.webp';
import { Footer } from './component/footer';
import ContactForm from './component/contact/contact';

const SKILLS = [
  { title: 'MERN Stack + NEXT.JS + Serverless / Edge + DJANGO Developer', level: '85%' },
  { title: 'Full Stack React Native Developer', level: '80%' },
  { title: 'AI Integrations { LLM API, TFJS, TFLite }', level: '70%' },
  { title: 'Production-Grade Scalable Backend Developer', level: '70%' },
];



export default function Home() {
  const [isContactVisible, setContactVisible] = useState(false);
  const handleContactClick = () => {
    setContactVisible(!isContactVisible);
  };

  return (
    <div className="bg-gradient-to-bl from-orange-900 via-gray-900 to-purple-900 min-h-screen flex flex-col items-center text-white relative overflow-hidden">
      {/* Navigation */}
      <nav className="w-full fixed top-0 left-0 z-50 backdrop-blur-md bg-gray-800/70 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-5">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-100 to-gray-300 text-transparent bg-clip-text">
            Aparna Pradhan
          </h2>
          <div className="space-x-8 text-base font-medium">
            <a 
              href="https://aparnap2.github.io/Aparna-Pradhan-blogs/" 
              className="relative hover:text-gray-300 transition-colors duration-300 after:content-[''] after:absolute after:w-0 after:h-0.5 after:bg-purple-500 after:left-0 after:-bottom-1 after:transition-all hover:after:w-full"
            >
              Blogs
            </a>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <header className="w-full max-w-7xl mx-auto px-8 pt-40 pb-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
          <div className="relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 to-orange-600 rounded-full blur opacity-30"></div>
            <Image 
              src={me} 
              alt="Aparna Pradhan" 
              width={240} 
              height={240} 
              className="relative rounded-full object-cover shadow-2xl" 
            />
          </div>
          <div className="text-center lg:text-left lg:pt-8">
            <h1 className="text-6xl font-geist-sans font-bold mb-6 bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
              Aparna Pradhan
            </h1>
            <div className="h-20 overflow-hidden mb-6">
              <p className="text-2xl md:text-3xl font-geist-mono text-gray-300">
                <Typewriter
                  words={[
                    'custom software solutions',
                    "MERN and NEXT.js Developer",
                    "React Native Expert",
                    "AI & ML, NLP, CV integration",
                    "Docker, Serverless",
                    "Cybersecurity, Blockchain",
                    "Data Science",
                    "Innovative Solutions for niche markets",
                    "High-Performance Apps",
                    "Eager to Continuous Learning"
                  ]}
                  loop
                  cursor
                  cursorStyle="|"
                  typeSpeed={150}
                  deleteSpeed={100}
                  delaySpeed={2000}
                />
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-base text-gray-400 font-medium">West Bengal, India 🇮🇳</p>
              <p className="text-xl text-gray-200">Full-time Freelancer • <span className="font-semibold text-purple-400">Open to Work</span></p>
            </div>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="w-full max-w-7xl mx-auto px-8 py-20">
        <div className="backdrop-blur-lg bg-gray-900/40 rounded-2xl shadow-2xl border border-gray-800/50 p-12">
          <h2 className="text-4xl font-geist-sans font-bold text-center mb-12 bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
            Who Am I?
          </h2>
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <div className="text-lg text-gray-300 leading-relaxed space-y-6">
              <p className="text-xl">
                Im a passionate <span className="text-purple-400 font-semibold">Full-Stack Web Developer</span> and 
                <span className="text-orange-400 font-semibold"> React Native Specialist</span>...
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span><strong className="text-white">MERN Stack</strong> (MongoDB, Express.js, React, Node.js)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span><strong className="text-white">TensorFlow.js</strong> for AI & ML integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span><strong className="text-white">Docker</strong> & Serverless Architectures</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span><strong className="text-white">Next.js</strong> and <strong className="text-white">GraphQL</strong> for modern web applications</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className=" text-x font-geist-sans text-gray-100 mb-6">Let&apos;s build something amazing together!</p>
           
          </div>
        </div>
      </section>

      {/* Skills Section - Now with enhanced styling */}
      <section id="skills" className="w-full max-w-7xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          Skills
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SKILLS.map((skill) => (
            <div key={skill.title} className="backdrop-blur-md bg-gray-900/30 rounded-xl p-6 border border-gray-800/50">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium text-gray-200">{skill.title}</span>
                  <span className="text-sm font-medium text-purple-400">{skill.level}</span>
                </div>
                <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-orange-600 rounded-full transition-all duration-1000"
                    style={{ width: skill.level }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="w-full max-w-7xl mx-auto px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          Featured Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative backdrop-blur-md bg-gray-900/30 rounded-2xl overflow-hidden border border-gray-800/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Image
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-100 mb-4">{project.title}</h3>
                <p className="text-gray-300 mb-6">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-4 py-1.5 bg-gray-800/50 text-gray-300 text-sm rounded-full border border-gray-700/50"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-orange-600 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                >
                  View Project
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
<ContactForm/>
      <ChatbotContainer />
      <Footer />
    </div>
  );
};


