'use client';
import { useState } from 'react';
import ChatbotContainer from './component/chatbot/chatbot';
import { projects } from './projects';
import { Typewriter } from 'react-simple-typewriter';
import Image from 'next/image';
import me from './public/images/me.jpg';

const SKILLS = [
  { title: 'MERN Stack + NEXT.JS + Serverless / Edge + DJANGO Developer', level: '85%' },
  { title: 'Full Stack React Native Developer', level: '80%' },
  { title: 'AI Integrations { LLM API, TFJS, TFLite }', level: '70%' },
  { title: 'Production-Grade Scalable Backend Developer', level: '70%' },
];


const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResponse(data.success ? 'Message sent successfully!' : 'Failed to send message.');
    } catch (error) {
      setResponse('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 rounded-lg bg-white bg-opacity-30 backdrop-blur-lg shadow-lg">
      <h3 className="text-2xl font-semibold text-center text-gray-800">Contact Me</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          className="w-full p-4 rounded-lg bg-opacity-40 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
          onChange={handleChange}
          value={formData.name}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          className="w-full p-4 rounded-lg bg-opacity-40 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
          onChange={handleChange}
          value={formData.email}
          required
        />
      </div>
      <textarea
        name="message"
        placeholder="Your Message"
        className="w-full p-4 rounded-lg bg-opacity-40 border border-gray-300 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none shadow-sm"
        onChange={handleChange}
        value={formData.message}
        required
      />
      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-orange-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
      {response && <p className="text-center text-sm text-gray-600 mt-4">{response}</p>}
    </form>
  );
};

export default function Home() {
  const [isContactVisible, setContactVisible] = useState(false);
  const handleContactClick = () => {
    setContactVisible(!isContactVisible);
  };

  return (
    <div className="bg-gradient-to-br from-orange-900 via-gray-900 to-orange-900 min-h-screen flex flex-col items-center text-white relative overflow-hidden">
      {/* Navigation */}
      <nav className="w-full fixed top-0 left-0 z-50 bg-gray-800 bg-opacity-70 py-4 shadow-lg backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6">
          <h2 className="text-xl font-semibold text-gray-200">Aparna Pradhan</h2>
          <div className="space-x-6 text-lg">
            <a href="https://aparnap2.github.io/Aparna-Pradhan-blogs/" className="hover:text-gray-400">
              Blogs
            </a>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <header className="w-full max-w-7xl mx-auto px-6 py-32 relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8">
        <Image src={me} alt="Aparna Pradhan" width={200} height={200} className="rounded-full object-cover shadow-lg" />
        <div>
          <h1 className="text-5xl font-bold mb-4 text-gray-100">Aparna Pradhan</h1>
          <p className="text-2xl text-gray-300 mb-4">
            <Typewriter
              words={[
         'custom Web and React Native solutions',      
   "MERN and NEXT.js Developer",
"React Native Expert",
"AI & ML,NLP,CV integration",
"Docker, Serverless",
"Cybersecurity, Blockchain",
"Data Science",
"Innovative Solutions for niche markets",
"High-Performance Apps",
"Egar to Continuous Learning"
              ]}
              loop
              cursor
              cursorStyle="|"
              typeSpeed={150}
              deleteSpeed={100}
              delaySpeed={2000}
            />
          </p>
          <p className="text-sm text-gray-400">West Bengal, India 🇮🇳</p>
          <p className="text-lg text-gray-100"><b>full time Freelancer</b></p>
        </div>
      </header>

      {/* Who Am I Section */}
      <section id="about" className="w-full max-w-7xl mx-auto px-6 py-16 bg-gray-900 rounded-lg shadow-xl backdrop-blur-md bg-opacity-40">
      <h2 className="text-4xl font-extrabold text-center text-gray-100 mb-8">Who Am I?</h2>
      
      <div className="flex flex-col lg:flex-row items-center gap-12">
        
        <div className="text-lg text-gray-300 leading-relaxed space-y-4">
          <p>
            I&apos;m a passionate <strong>Full-Stack Web Developer</strong> and <strong>React Native Specialist</strong> with a love for crafting scalable, high-performance web applications using technologies like <em>MERN Stack</em>, <em>Next.js</em>, and <em>Django</em>. I focus on building applications that are <span className="font-bold text-indigo-400">fast</span>, <span className="font-bold text-indigo-400">reliable</span>, and <span className="font-bold text-indigo-400">user-friendly</span>.
          </p>
          <p>
            My expertise extends to <strong>AI & ML Integrations</strong>, where I leverage <em>TensorFlow.js</em>, <em>TFLite</em>, and <strong>Large Language Models</strong> (LLMs) to create innovative and intelligent solutions. I have a keen interest in <em><strong>NLP</strong></em>, <em><strong>Computer Vision</strong></em>, and integrating <strong>AI</strong> into modern applications to drive real-world impact.
          </p>
          <p>
            I&apos;m also experienced with <em>Docker</em>, <em>Nginx</em>, <em>Redis</em>, and have a deep understanding of <strong>serverless architectures</strong>, allowing me to design and deploy robust systems. With a focus on continuous learning, I stay updated on <strong>cybersecurity</strong>, <strong>blockchain</strong>, and <strong>data science</strong>, which fuels my drive for innovation.
          </p>

          <ul className="list-inside list-disc space-y-2 text-gray-400">
            <li><strong>Technologies I use:</strong></li>
            <li><em>MERN Stack</em> (MongoDB, Express.js, React, Node.js)</li>
            <li><em>TensorFlow.js</em> for AI & ML integrations</li>
            <li><strong>Docker</strong> & <strong>Serverless Architectures</strong></li>
            <li><em>Next.js</em> and <strong>GraphQL</strong> for modern web applications</li>
          </ul>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-xl text-gray-400">Let&apos;s build something amazing together!</p>
        <button
          onClick={handleContactClick}
          className="mt-4 inline-block px-8 py-3 text-lg font-semibold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 hover:shadow-2xl"
  >
          Get in Touch
        </button>
        
        {/* Floating contact options */}
        {isContactVisible && (
          <div className="fixed bottom-24 right-6 space-y-4 z-50">
            <div className="flex flex-col items-end gap-4">
              <a
                href='https://www.linkedin.com/in/aparna-pradhan-06b882215/'
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-all duration-300"
              >
                LinkedIn
              </a>
              <a
                href='https://x.com/Aparna_108_dev'
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all duration-300"
              >
                X (Twitter)
              </a>
              <a
                href='https://github.com/Aparnap2/'
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-gray-800 text-white rounded-full shadow-md hover:bg-gray-900 transition-all duration-300"
          >
                GitHub
              </a>
            </div>
          </div>
        )}
      </div>
    </section>

      {/* Skills Section */}
      <section id="skills" className="w-full max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-semibold text-center mb-10 text-gray-200">Skills</h2>
        <div className="space-y-6">
          {SKILLS.map((skill) => (
            <div key={skill.title} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">{skill.title}</span>
                <span className="text-sm text-gray-400">{skill.level}</span>
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                  style={{ width: skill.level }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="w-full max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105 bg-opacity-40 backdrop-blur-lg"
          >
            <Image
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-52 object-cover rounded-t-xl"
            />
            <div className="p-6">
              <h3 className="text-xl font-bold text-indigo-600 mb-2">{project.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-gray-800 text-white text-sm rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 py-2 px-6 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
              >
                View Project
              </a>
            </div>
          </div>
        ))}
      </section>

      {/* Contact Section */}
      <section id="contact" className="w-full max-w-7xl mx-auto px-6 py-16">
        <ContactForm />
      </section>

      {/* Chatbot */}
      <ChatbotContainer />
    </div>
  );
}
