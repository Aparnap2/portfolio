"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { projects } from '../../projects';
import EnhancedProjectCard from './EnhancedProjectCard';
import SectionHeading from '../ui/SectionHeading';
import SectionDivider from '../ui/SectionDivider';

// Filter buttons for projects
const FilterButton = ({ active, onClick, children }) => (
  <motion.button
    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${active ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-slate-800/70 text-gray-300 hover:bg-slate-700/50'}`}
    onClick={onClick}
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.97 }}
  >
    {children}
  </motion.button>
);

// Improved Projects Section
const ImprovedProjectsSection = () => {
  const [filter, setFilter] = useState('all');

  // All unique categories from projects
  const categories = ['all', ...new Set(projects.flatMap(p => p.categories || ['other']))];

  // Filter projects based on selected category
  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => (p.categories || []).includes(filter));

  return (
    <section id="projects" className="py-20 relative">
      <SectionDivider title="Creative Work" accent="purple" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading 
          title="Featured Projects"
          subtitle="Showcasing some of my recent work in AI integration and modern web development"
          accent="orange"
        />

        {/* Category filter */}
        <div className="mb-10 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex space-x-2 min-w-max">
            {categories.map((category) => (
              <FilterButton
                key={category}
                active={filter === category}
                onClick={() => setFilter(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </FilterButton>
            ))}
          </div>
        </div>

        {/* Projects grid with filtering animation */}
        <motion.div 
          className="grid grid-cols-1 gap-8 lg:gap-10 max-w-5xl mx-auto"
          layout
          transition={{ duration: 0.4, type: "spring" }}
        >
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project, index) => (
              <EnhancedProjectCard key={project.id} project={project} index={index} />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-gray-400">No projects found in this category.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ImprovedProjectsSection;
