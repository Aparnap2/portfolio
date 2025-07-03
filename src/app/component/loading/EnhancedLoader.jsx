"use client";
import { motion } from 'framer-motion';

const EnhancedLoader = () => {
  // Variants for container animation
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    },
    exit: { 
      opacity: 0,
      transition: { 
        duration: 0.5,
        when: "afterChildren",
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    }
  };

  // Variants for the logo animation
  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
    exit: { 
      scale: 1.2, 
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  };

  // Variants for the progress bar
  const progressVariants = {
    initial: { width: 0 },
    animate: { 
      width: "100%",
      transition: { 
        duration: 1.5, 
        ease: "easeInOut"
      }
    }
  };

  // Variants for the text
  const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    exit: { 
      y: -20, 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-slate-900 to-purple-900/30 z-50 flex flex-col items-center justify-center"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 text-center">
        {/* Logo animation */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 relative"
          variants={logoVariants}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-xl"></div>
          <div className="relative w-full h-full flex items-center justify-center text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            A.dev
          </div>
        </motion.div>

        {/* Loading text */}
        <motion.p
          className="text-xl sm:text-2xl font-medium text-white mb-6"
          variants={textVariants}
        >
          Preparing Experience
        </motion.p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            variants={progressVariants}
          ></motion.div>
        </div>

        {/* Status text */}
        <motion.p
          className="text-sm text-gray-400"
          variants={textVariants}
        >
          Loading creative inspiration...
        </motion.p>
      </div>
    </motion.div>
  );
};

export default EnhancedLoader;
