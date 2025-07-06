"use client";
import { useState, useEffect } from 'react'; // Added useEffect
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

const INITIAL_VISIBLE_PROJECTS = 6;
const PROJECTS_TO_LOAD_MORE = 6;

// Improved Projects Section
const ImprovedProjectsSection = () => {
  const [filter, setFilter] = useState('all');
  const [visibleProjectsCount, setVisibleProjectsCount] = useState(INITIAL_VISIBLE_PROJECTS);

  // All unique categories from projects
  const categories = ['all', ...new Set(projects.flatMap(p => p.categories || ['other']))];

  // Filter projects based on selected category
  const baseFilteredProjects = filter === 'all'
    ? projects 
    : projects.filter(p => (p.categories || []).includes(filter));

  const visibleProjects = baseFilteredProjects.slice(0, visibleProjectsCount);

  const handleLoadMore = () => {
    setVisibleProjectsCount(prevCount => prevCount + PROJECTS_TO_LOAD_MORE);
  };

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleProjectsCount(INITIAL_VISIBLE_PROJECTS);
  }, [filter]);

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
          {visibleProjects.length > 0 ? (
            visibleProjects.map((project, index) => (
              <EnhancedProjectCard key={project.id} project={project} index={index} />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10 col-span-full" // Ensure it spans full width if grid
            >
              <p className="text-gray-400 text-lg">No projects found in this category.</p>
            </motion.div>
          )}
        </motion.div>

        {visibleProjectsCount < baseFilteredProjects.length && (
          <div className="mt-12 text-center">
            <motion.button
              onClick={handleLoadMore}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Load More Projects
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ImprovedProjectsSection;
