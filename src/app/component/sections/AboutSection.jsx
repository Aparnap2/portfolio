"use client";
import { motion } from 'framer-motion';
import Image from 'next/image';
import SectionTitle from '../SectionTitle'; // Path assuming SectionTitle is in src/app/component
import me from '../../public/images/me.jpeg'; // Adjusted path for the image

// About Section
const AboutSection = () => {
  return (
    <section id="about" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <SectionTitle
              title="About Me"
              subtitle="I'm Aparna Pradhan, a full-stack web and React Native developer deeply focused on building AI-integrated, niche-specific solutions — from automation and chatbots to SaaS tools and research systems."
            />
            <p className="text-lg text-gray-300 mb-6">
              I&#39;m Aparna Pradhan, a full-stack web and React Native developer deeply focused on building AI-integrated, niche-specific solutions — from automation and chatbots to SaaS tools and research systems. I specialize in RAG, vector/graph DBs, LangChain, LangGraph, and memory-aware generation workflows.
            </p>
            <p className="text-lg text-gray-300 mb-8">
              Based in West Bengal, India, I build modern, efficient AI-first applications that solve real-world problems for solopreneurs, SaaS startups, and small businesses. From agentic platforms to WhatsApp automation — I turn AI into leverage.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm">AI + Fullstack Expert</span>
              <span className="px-4 py-2 bg-pink-500/20 text-pink-300 rounded-full text-sm">Custom Agent Architect</span>
              <span className="px-4 py-2 bg-orange-500/20 text-orange-300 rounded-full text-sm">Next.js | Expo | LangChain</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="w-full max-w-md mx-auto">
              <div className="relative w-80 h-80 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-30"></div>
                <div className="relative w-full h-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <Image
                    src={me}
                    alt="Aparna Pradhan"
                    fill
                    className="object-cover rounded-full shadow-lg"
                    priority
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
