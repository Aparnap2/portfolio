"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden">
      {/* Dim overlay for readability */}
      <div className="absolute inset-0 bg-slate-900/70 z-10 pointer-events-none"></div>
      {/* Base color */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800"></div>

      {/* Animated orbs with responsive sizing and higher opacity */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute w-[50vw] md:w-[40vw] lg:w-[30vw] aspect-square bg-gradient-to-r from-purple-500/70 to-pink-500/70 rounded-full mix-blend-screen filter blur-xl"
          animate={prefersReducedMotion ? {} : {
            x: ['-10vw', '10vw', '-10vw'],
            y: ['-10vh', '10vh', '-10vh'],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-[60vw] md:w-[45vw] lg:w-[35vw] aspect-square bg-gradient-to-r from-blue-500/70 to-cyan-500/70 rounded-full mix-blend-screen filter blur-xl"
          animate={prefersReducedMotion ? {} : {
            x: ['10vw', '-10vw', '10vw'],
            y: ['10vh', '-10vh', '10vh'],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ top: '60%', right: '10%' }}
        />
        <motion.div
          className="absolute w-[40vw] md:w-[30vw] lg:w-[25vw] aspect-square bg-gradient-to-r from-orange-500/70 to-yellow-500/70 rounded-full mix-blend-screen filter blur-xl"
          animate={prefersReducedMotion ? {} : {
            x: ['0vw', '15vw', '0vw'],
            y: ['0vh', '-15vh', '0vh'],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ bottom: '10%', left: '30%' }}
        />
      </div>

      {/* Grid overlay with responsive sizing */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:25px_25px] sm:bg-[size:35px_35px] md:bg-[size:50px_50px]"></div>
    </div>
  );
};

export default AnimatedBackground;
