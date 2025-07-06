"use client";
import React, { useState, useRef, useEffect } from 'react'; // Added React import
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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

// Optimized Image Component with Skeleton Loading
const OptimizedImage = ({ src, alt, priority = false, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/80 to-zinc-700/80 animate-pulse">
          <div className="h-full w-full bg-shimmer"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
        className={`object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoadingComplete={() => setIsLoaded(true)}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ value, label }) => (
  <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-xl border border-zinc-700/50 hover:border-orange-500/30 transition-colors">
    <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
      {value}
    </p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

// Enhanced Project Card
const EnhancedProjectCard = ({ project, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  // Intersection observer for lazy loading
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
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Background animation variants
  const bgVariants = {
    initial: { backgroundPosition: '0% 0%' },
    hover: { 
      backgroundPosition: '100% 100%',
      transition: { duration: 3, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className={`group relative backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800/50 hover:border-orange-500/20 transition-all duration-300 ${isExpanded ? 'ring-2 ring-purple-500/30' : ''}`}
      layout
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 via-zinc-800/40 to-zinc-900/80 opacity-80 z-0"
        variants={bgVariants}
        initial="initial"
        whileHover="hover"
        animate={isExpanded ? "hover" : "initial"}
      />

      <div className="relative z-10 p-6 md:p-8">
        {/* Preview Header - Always visible */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              {project.icon && (
                <span className="text-2xl md:text-3xl">
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

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${isExpanded ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-zinc-800/80 text-gray-300 border-zinc-700/50 hover:bg-zinc-700/50'}`}
              whileTap={{ scale: 0.97 }}
              aria-expanded={isExpanded}
              aria-controls={`project-details-${project.id}`}
            >
              {isExpanded ? 'Show Less' : 'View Details'}
            </motion.button>

            {/* Quick Links */}
            <div className="flex gap-2">
              {project.githubUrl && (
                <motion.a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-800/80 text-gray-300 border border-zinc-700/50 hover:bg-zinc-700/50 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="View Code on GitHub"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.337-3.369-1.337-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.293 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path>
                  </svg>
                </motion.a>
              )}
              {project.liveUrl && project.status.toLowerCase() === 'production' && (
                <motion.a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-pink-600 text-white hover:opacity-90 transition-opacity"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Visit Live Demo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.a>
              )}
            </div>
          </div>
        </div>

        {/* Project Brief - Always visible */}
        <div className="mb-6">
          <p className="text-gray-300 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Project Details - Conditionally visible */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              id={`project-details-${project.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Image and Tech Stack */}
                <div className="w-full lg:w-2/5">
                  <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-zinc-700/50 group-hover:border-orange-500/50 transition-colors">
                    <OptimizedImage
                      src={project.image}
                      alt={project.title}
                      priority={index < 2}
                    />
                  </div>

                  {/* Tech Stack Section */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                      TECH STACK
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {project.stack.map((tech, idx) => (
                        <motion.span
                          key={idx}
                          className="text-xs px-3 py-1.5 bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-gray-200 rounded-full border border-zinc-700/50 hover:border-orange-500/50 transition-colors"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  {project.metrics && project.metrics.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
                        <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                        KEY METRICS
                      </h3>
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
                        <li key={i} className="flex items-start group">
                          <span className="text-emerald-400 mr-2 mt-0.5 group-hover:scale-110 transition-transform">✓</span>
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
                          <div key={i} className="flex items-start group">
                            <span className="text-amber-400 mr-2 mt-0.5 group-hover:rotate-12 transition-transform">•</span>
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
                          <div className="hover:bg-zinc-800/30 p-2 rounded-lg transition-colors">
                            <h5 className="text-xs font-medium text-gray-400 mb-1">MY ROLE</h5>
                            <p className="text-sm text-gray-300">{project.role}</p>
                          </div>
                        )}
                        {project.teamSize && (
                          <div className="hover:bg-zinc-800/30 p-2 rounded-lg transition-colors">
                            <h5 className="text-xs font-medium text-gray-400 mb-1">TEAM SIZE</h5>
                            <p className="text-sm text-gray-300">{project.teamSize}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default React.memo(EnhancedProjectCard);
