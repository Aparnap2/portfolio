"use client";
import { motion } from 'framer-motion';

// Loading Component
const LoadingScreen = () => (
  <motion.div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.75) 0%, rgba(236,72,153,0.75) 100%)',
      // This is a purple-to-pink gradient with 75% opacity
      backdropFilter: 'blur(4px)',
    }}
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="text-center">
      <motion.div
        className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-t-transparent"
        style={{
          borderColor: 'rgba(236,72,153,0.8) rgba(139,92,246,0.8) rgba(139,92,246,0.8) rgba(236,72,153,0.8)',
          borderTopColor: 'transparent',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.p
        className="text-lg font-medium bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
      >
        Loading Portfolio...
      </motion.p>
    </div>
  </motion.div>
);

export default LoadingScreen;
