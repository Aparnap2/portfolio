import React from 'react';
import { motion } from 'framer-motion';

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
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
            {project.title}
        </h2>
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold text-orange-400">Problem:</h3>
                <p className="text-gray-300">{project.problem}</p>
            </div>
            <div>
                <h3 className="font-semibold text-green-400">My Solution:</h3>
                <p className="text-gray-300">{project.solution}</p>
            </div>
            <div>
                <h3 className="font-semibold text-cyan-400">Impact:</h3>
                <p className="text-gray-300">{project.impact}</p>
            </div>
            <div>
                <h3 className="font-semibold text-purple-400">Stack:</h3>
                <p className="text-gray-300">{project.stack.join(', ')}</p>
            </div>
            <div>
                <h3 className="font-semibold text-gray-400">Role:</h3>
                <p className="text-gray-300">{project.role}</p>
            </div>
            <div>
                <h3 className="font-semibold text-gray-400">Status:</h3>
                <p className="text-gray-300">{project.status}</p>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
