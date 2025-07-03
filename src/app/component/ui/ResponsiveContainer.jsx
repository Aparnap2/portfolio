"use client";
import { motion } from 'framer-motion';

export const ResponsiveContainer = ({ 
  id, 
  className = "", 
  children, 
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.5 }
}) => {
  return (
    <section id={id} className={`py-16 sm:py-20 md:py-24 ${className}`}>
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={initial}
        whileInView={animate}
        viewport={{ once: true, margin: "-100px" }}
        transition={transition}
      >
        {children}
      </motion.div>
    </section>
  );
};

export default ResponsiveContainer;