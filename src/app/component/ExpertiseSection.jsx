"use client";
import { motion } from 'framer-motion';
import { FiCode, FiServer } from 'react-icons/fi';
import { FaMobileAlt, FaRobot } from 'react-icons/fa';
import { spaceGrotesk } from '../fonts'; // Adjusted path
import SectionTitle from './SectionTitle'; // Path assuming SectionTitle is in src/app/component

// Expertise Section from the second snippet with enhancements
const ExpertiseSection = () => {
  const expertise = [
    {
      title: "Full-Stack Development",
      description: "End-to-end web development with modern technologies and best practices.",
      color: "from-orange-900/30 to-orange-800/10",
      icon: <FiCode className="w-6 h-6 text-orange-400" />,
      techs: ["Next.js", "React", "Node.js", "MongoDB", "PostgreSQL", "Prisma", "Redis", "TailwindCSS", "ShadcnUI", "Stripe", "NextAuth", "JWT", "Clerk", "Upstash", "graphql"]
    },
    {
      title: "Mobile Development",
      description: "Building cross-platform mobile applications with React Native.",
      color: "from-blue-900/30 to-blue-800/10",
      icon: <FaMobileAlt className="w-6 h-6 text-blue-400" />,
      techs: ["Expo", "nativewind", "zustand", "Firebase / appwrite / supabase / custom", "Push Notifications", "Offline First"]
    },
    {
      title: "AI Integration",
      description: "Seamlessly integrating AI capabilities into existing applications.",
      color: "from-green-900/30 to-green-800/10",
      icon: <FaRobot className="w-6 h-6 text-green-400" />,
      techs: ["LLM API", "LangChain", "Vector DBs", "third party APIs", "AI agents", "workflow automation"]
    },
    {
      title: "Backend Development",
      description: "Scalable and efficient server-side solutions for your applications.",
      color: "from-red-900/30 to-red-800/10",
      icon: <FiServer className="w-6 h-6 text-red-400" />,
      techs: ["Node.js", "Express", "Django", "FastAPI", "MongoDB", "PostgreSQL"]
    }
  ];

  return (
    <section id="expertise" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="My Expertise"
          subtitle="I specialize in creating intelligent solutions that drive growth and efficiency for your business."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {expertise.map((item, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 border border-orange-500/20 hover:border-orange-400/40 transition-all duration-300 group`}
              whileHover={{ y: -5, scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className={`text-xl font-bold text-white mb-3 ${spaceGrotesk.className}`}>{item.title}</h3>
              <p className="text-gray-400 mb-4">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                {item.techs.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-800/50 text-gray-200 text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExpertiseSection;
