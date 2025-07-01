import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Status Badge Component with simplified animation
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
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MetricCard = ({ value, label }) => (
  <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-xl border border-zinc-700/50 hover:border-orange-500/30 transition-colors">
    <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
      {value}
    </p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

export const ProjectCard = ({ project, index }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

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
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300"
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
                sizes="(max-width: 1024px) 100vw, 40vw"
                className={`object-cover transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoadingComplete={() => setIsImageLoaded(true)}
                priority={index < 3}
              />
              {!isImageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse"></div>
              )}
              
              {/* Tech Stack Overlay - Removed from here */}
            </div>

            {/* Tech Stack Section */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">TECH STACK</h3>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tech, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-3 py-1.5 bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-gray-200 rounded-full border border-zinc-700/50 hover:border-orange-500/50 transition-colors"
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

export default ProjectCard;
