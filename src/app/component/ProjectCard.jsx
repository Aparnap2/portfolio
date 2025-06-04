import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Status Badge Component with different colors for different statuses
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
    <motion.span 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status}
    </motion.span>
  );
};

export const ProjectCard = ({ project, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.2, 0.8, 0.2, 1]
      } 
    },
    hover: {
      z: 1,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    }
  };

  const imageVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-orange-500/30 transition-all duration-300"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Image Container */}
          <motion.div 
            className="relative w-full md:w-2/5 aspect-video overflow-hidden rounded-xl border border-zinc-700/50 group-hover:border-orange-500/50 transition-colors duration-500"
            variants={imageVariants}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Image
              src={project.image}
              alt={project.title}
              width={1467}
              height={759}
              loading="lazy"
              className={`object-contain transition-transform duration-700 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoadingComplete={() => setIsImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '759px',
                margin: '0 auto',
                display: 'block'
              }}
            />
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse"></div>
            )}
            
            {/* Tech Stack Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex flex-wrap gap-2">
                {project.stack.slice(0, 4).map((tech, idx) => (
                  <motion.span 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (idx + 1) }}
                    className="text-xs px-2.5 py-1 bg-zinc-800/80 text-gray-300 rounded-full border border-zinc-700/50 backdrop-blur-sm"
                  >
                    {tech}
                  </motion.span>
                ))}
                {project.stack.length > 4 && (
                  <span className="text-xs px-2.5 py-1 bg-zinc-800/80 text-gray-400 rounded-full">
                    +{project.stack.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </motion.div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <motion.h3 
                className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {project.title}
              </motion.h3>
              <div className="flex items-center gap-2">
                {project.icon && (
                  <motion.span 
                    className="text-2xl"
                    animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {project.icon}
                  </motion.span>
                )}
                <StatusBadge status={project.status} />
              </div>
            </div>
            
            <motion.p 
              className="text-gray-300 mb-6 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {project.description}
            </motion.p>
            
            {/* Challenge & Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <motion.div 
                className="bg-zinc-800/40 p-4 rounded-lg border border-zinc-700/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2"></span>
                  The Challenge
                </h4>
                <p className="text-sm text-gray-300">{project.problem}</p>
              </motion.div>
              
              <motion.div 
                className="bg-zinc-800/40 p-4 rounded-lg border border-zinc-700/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                  Our Solution
                </h4>
                <p className="text-sm text-gray-300">{project.solution}</p>
              </motion.div>
            </div>
            
            {/* Key Results */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                Key Results & Impact
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {project.results.map((result, i) => (
                  <motion.li 
                    key={i}
                    className="flex items-start text-sm text-gray-300 bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-700/30"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + (i * 0.1) }}
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-emerald-400 mr-2">✓</span>
                    <span>{result}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* Buttons */}
            <motion.div 
              className="flex flex-wrap gap-3 mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all flex items-center justify-center gap-2 group"
                >
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  View on GitHub
                </a>
              )}
              
              {project.liveUrl && project.status.toLowerCase() === 'production' && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-lg transition-all flex items-center justify-center gap-2 group shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
                >
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Live Demo
                </a>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
