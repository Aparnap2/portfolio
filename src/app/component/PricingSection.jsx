"use client";
import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import SectionTitle from './SectionTitle';

// Pricing Section with performance optimizations
const PricingSection = () => {
  const [activeTab, setActiveTab] = useState('fiverr');

  // Dynamically import pricing components with no SSR
  const FiverrPricing = dynamic(
    () => import('./pricing/FiverrPricing').then(mod => mod.FiverrPricing),
    { ssr: false, loading: () => <div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div> }
  );

  const UpworkPricing = dynamic(
    () => import('./pricing/UpworkPricing').then(mod => mod.UpworkPricing),
    { ssr: false, loading: () => <div className="min-h-[400px] flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div> }
  );

  return (
    <section id="pricing" className="relative py-16 sm:py-24 overflow-hidden">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <SectionTitle
          title="Pricing & Services"
          subtitle="Choose the perfect plan that fits your needs. Whether you prefer fixed-price projects or hourly contracts, I&#39;ve got you covered."
        />

        <div className="mb-12 max-w-3xl mx-auto text-center">
          <p className="text-gray-300">
            The pricing shown serves as a reference point. Every project is unique, and I&apos;m committed to tailoring my services to your specific requirements.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="relative flex flex-col sm:flex-row w-full max-w-md sm:w-auto sm:inline-flex">
            <button
              onClick={() => setActiveTab('fiverr')}
              className={`relative px-6 py-3 text-sm md:text-base font-medium transition-all duration-300 ${
                activeTab === 'fiverr' 
                  ? 'text-white border-b-2 border-orange-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Fiverr Services
            </button>
            <button
              onClick={() => setActiveTab('upwork')}
              className={`relative px-6 py-3 text-sm md:text-base font-medium transition-all duration-300 ${
                activeTab === 'upwork' 
                  ? 'text-white border-b-2 border-green-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upwork Services
            </button>
          </div>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="w-full min-h-[500px] md:min-h-[800px] transition-all duration-500">
            <AnimatePresence mode="wait">
              {activeTab === 'fiverr' && (
                <motion.div
                  key="fiverr"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Suspense fallback={
                    <div className="min-h-[400px] flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }>
                    <FiverrPricing />
                  </Suspense>
                </motion.div>
              )}
              {activeTab === 'upwork' && (
                <motion.div
                  key="upwork"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Suspense fallback={
                    <div className="min-h-[400px] flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  }>
                    <UpworkPricing />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
