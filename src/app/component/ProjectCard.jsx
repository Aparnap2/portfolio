import React from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiTool, FiDollarSign, FiUsers, FiTrendingUp } from 'react-icons/fi';

const MetricCard = ({ value, label }) => (
  <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-xl border border-zinc-700/50 hover:border-orange-500/30 transition-colors">
    <p className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
      {value}
    </p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

const InfoPill = ({ icon, text, className }) => (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${className}`}>
        {icon}
        <span>{text}</span>
    </div>
);

export const ProjectCard = ({ project, index }) => {
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
        {/* Header */}
        <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {project.title}
            </h2>
            <p className="text-orange-400 font-medium mt-1">{project.tagline}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Problem, Solution, Impact */}
            <div className="md:col-span-2 space-y-6">
                {/* Problem & Solution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/50">
                        <h4 className="text-sm font-semibold text-orange-400 mb-2">The Problem</h4>
                        <p className="text-sm text-gray-300">{project.problem}</p>
                    </div>
                    <div className="bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/50">
                        <h4 className="text-sm font-semibold text-green-400 mb-2">The Solution</h4>
                        <p className="text-sm text-gray-300">{project.solution}</p>
                    </div>
                </div>

                {/* Impact */}
                <div>
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2"><FiTrendingUp /> Impact</h4>
                    <p className="text-sm text-gray-300 bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/50">{project.impact}</p>
                </div>

                {/* Business Value */}
                <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-2"><FiDollarSign /> Business Value</h4>
                    <p className="text-sm text-gray-300 bg-zinc-800/40 p-4 rounded-xl border border-zinc-700/50">{project.businessValue}</p>
                </div>
            </div>

            {/* Right Column: Stack, Metrics, Info */}
            <div className="space-y-6">
                {/* Stack */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><FiTool/> Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                        {project.stack.map((tech, idx) => (
                        <span key={idx} className="text-xs px-3 py-1.5 bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-gray-200 rounded-full border border-zinc-700/50">
                            {tech}
                        </span>
                        ))}
                    </div>
                </div>

                {/* Metrics */}
                {project.metrics && project.metrics.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><FiTarget /> Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                    {project.metrics.map((metric, idx) => (
                        <MetricCard key={idx} value={metric.value} label={metric.label} />
                    ))}
                    </div>
                </div>
                )}

                {/* Client & Pricing */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Project Info</h3>
                    <InfoPill
                        icon={<FiUsers />}
                        text={project.clientType}
                        className="bg-blue-500/10 text-blue-300 border-blue-500/20"
                    />
                    <InfoPill
                        icon={<FiDollarSign />}
                        text={project.pricingTier}
                        className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                    />
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
