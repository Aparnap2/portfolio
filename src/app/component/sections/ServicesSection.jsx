"use client";
import { motion } from 'framer-motion';
import { FiCode, FiServer, FiDatabase } from 'react-icons/fi';
import { FaRobot, FaMobileAlt, FaBrain } from 'react-icons/fa';

// Services Section
const ServicesSection = () => {
  const services = [
    {
      icon: <FiCode className="w-8 h-8" />,
      title: "Full-Stack Development",
      description: "End-to-end web applications with modern technologies like React, Next.js, and Node.js",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <FaRobot className="w-8 h-8" />,
      title: "AI Integration",
      description: "Seamlessly integrate AI capabilities into your applications with LLMs, machine learning, and automation",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <FaMobileAlt className="w-8 h-8" />,
      title: "Mobile Development",
      description: "Cross-platform mobile applications with React Native and modern mobile technologies",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <FiServer className="w-8 h-8" />,
      title: "Backend Development",
      description: "Scalable server-side solutions with APIs, databases, and cloud infrastructure",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <FaBrain className="w-8 h-8" />,
      title: "AI Consulting",
      description: "Strategic guidance on AI adoption and implementation for your business needs",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: <FiDatabase className="w-8 h-8" />,
      title: "Data Solutions",
      description: "Database design, data analytics, and business intelligence solutions",
      color: "from-teal-500 to-blue-500"
    }
  ];

  return (
    <section id="services" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            My <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            I offer comprehensive solutions to help your business leverage modern technology and AI
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className="h-full p-8 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${service.color} flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
                <p className="text-gray-300 leading-relaxed">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
