'use client';
import { useState } from 'react';
import ChatbotContainer from "./component/chatbot/chatbot";
import { projects } from "./projects";
import { Typewriter } from 'react-simple-typewriter';
import Image from 'next/image';
import me from './public/images/me.jpg';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert('Message sent successfully!');
      } else {
        alert('Failed to send message.');
      }
    } catch (error) {
      alert('An error occurred.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          className="w-full p-4 rounded-lg glass border border-white text-slate-800"
          onChange={handleChange}
          value={formData.name}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          className="w-full p-4 rounded-lg glass border border-blue-600 text-black"
          onChange={handleChange}
          value={formData.email}
          required
        />
      </div>
      <textarea
        name="message"
        placeholder="Your Message"
        className="w-full p-4 rounded-lg glass border border-white text-green-950"
        onChange={handleChange}
        value={formData.message}
        required
      />
      <button
        type="submit"
        className="btn-saffron w-full mt-4"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
      {response && <p>{response}</p>}
    </form>
  );
};

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-orange-900 via-black to-blue-900 min-h-screen flex flex-col items-center text-white relative overflow-hidden">
      {/* Stripes Design */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent absolute top-0 left-0 right-0 bottom-0 transform skew-y-12"></div>
        <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-500/10 to-transparent absolute top-0 left-0 right-0 bottom-0 transform -skew-y-12"></div>
      </div>

      {/* Header Section */}
      <header className="w-full max-w-5xl mx-auto px-4 py-8 text-center">
        <div className="flex flex-col items-center mb-8">
          <Image
            src={me}
            alt="Description of me"
            width={500}
            height={500}
            className="w-32 h-32 rounded-full object-cover mb-4 shadow-lg"
          />
          <h1 className="text-5xl font-bold font-serif mb-2">Aparna Pradhan</h1>
          <p className="text-xl mb-2">
            <Typewriter
              words={['AI SaaS Enthusisast', 'Next js serverless/Edge + MERN + React Native developer', 'Emerging tech Enthusiast , LLM , RAG Pipepline , AI Automation specialized.', 'and most importantly Always curious and egar to learn !']}
              loop={true}
              cursor
              cursorStyle="🇮🇳"
              typeSpeed={100}
              deleteSpeed={50}
              delaySpeed={2000}
            />
          </p>
          <p className="text-base mb-4">West Bengal, India</p>
         
        </div>
      </header>
      {/* Projects Section */}
      <section className="w-full max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <div
            key={project.id}
            className="glass rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
          >
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-40 object-cover"
            />
            <div className="p-4">
              <h3 className="text-xl font-mono font-bold text-blue-950 mb-2">{project.title}</h3>
              <p className="text-sm text-gray-900 mb-4">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-gray-800 text-sm rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-saffron block mt-4"
              >
                View Project
              </a>
            </div>
          </div>
        ))}
      </section>
      {/* Contact Section */}
      <ContactForm />
      {/* Chatbot Container */}
      <ChatbotContainer />
      {/* Footer */}
      <footer className="py-8 text-center">
        <p>&copy; 2024 Aparna Pradhan. All rights reserved with 💯 .</p>
      </footer>
    </div>
  );
}
