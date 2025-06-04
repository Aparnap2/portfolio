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
      {status}
    </span>
  );
};

export const ProjectCard = ({ project, index }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Simplified animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        delay: Math.min(index * 0.05, 0.3), // Cap the delay
      } 
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-orange-500/30 transition-colors duration-200"
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image Container */}
          <div className="relative w-full md:w-2/5 aspect-video overflow-hidden rounded-xl border border-zinc-700/50 group-hover:border-orange-500/50 transition-colors">
            <Image
              src={project.image}
              alt={project.title}
              width={800}
              height={450}
              loading="lazy"
              className={`object-contain transition-opacity duration-300 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoadingComplete={() => setIsImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, 40vw"
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900"></div>
            )}
            
            {/* Tech Stack Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex flex-wrap gap-2">
                {project.stack.slice(0, 4).map((tech, idx) => (
                  <span 
                    key={idx}
                    className="text-xs px-2.5 py-1 bg-zinc-800/80 text-gray-300 rounded-full border border-zinc-700/50 backdrop-blur-sm"
                  >
                    {tech}
                  </span>
                ))}
                {project.stack.length > 4 && (
                  <span className="text-xs px-2.5 py-1 bg-zinc-800/80 text-gray-400 rounded-full">
                    +{project.stack.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {project.title}
              </h3>
              <div className="flex items-center gap-2">
                {project.icon && (
                  <span className="text-2xl">
                    {project.icon}
                  </span>
                )}
                <StatusBadge status={project.status} />
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              {project.description}
            </p>
            
            {/* Challenge & Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-800/40 p-4 rounded-lg border border-zinc-700/50">
                <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2"></span>
                  The Challenge
                </h4>
                <p className="text-sm text-gray-300">{project.problem}</p>
              </div>
              
              <div className="bg-zinc-800/40 p-4 rounded-lg border border-zinc-700/50">
                <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                  Our Solution
                </h4>
                <p className="text-sm text-gray-300">{project.solution}</p>
              </div>
            </div>
            
            {/* Key Results */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                Key Results & Impact
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.results.map((result, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span className="text-sm text-gray-300">{result}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {project.liveUrl && project.status.toLowerCase() === 'production' && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
                >
                  Live Demo
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors"
                >
                  View Code
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
