"use client";
import { FiMail, FiMapPin, FiLinkedin, FiTwitter } from 'react-icons/fi';
import { spaceGrotesk, firaCode } from '../fonts';
import SectionTitle from './SectionTitle';

// Contact Section
const ContactSection = () => {
  return (
    <section id="contact" className="py-20 sm:py-24 flex flex-col items-center">
      <div className="max-w-4xl w-full px-4 sm:px-6 lg:px-8">
        <SectionTitle 
          title="Ready to Transform Your Business with AI?"
          subtitle="I'm here to help you navigate the world of AI and build solutions that make an impact."
        />

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 sm:p-12 border border-white/10 shadow-xl text-center">
          <h3 className={`text-2xl sm:text-3xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>Get in Touch</h3>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Have a project in mind or want to discuss how AI can benefit your business? I&apos;m always open to new opportunities and collaborations.
          </p>

          <a
            href="mailto:softservicesinc.portfolio@gmail.com"
            className="inline-block bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium px-8 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300"
          >
            <FiMail className="inline-block w-5 h-5 mr-2 -mt-1" />
            Send a Message
          </a>

          <div className="mt-12">
            <p className="text-gray-400 mb-4">Connect with me</p>
            <div className="flex justify-center space-x-6">
              <a
                href="https://www.linkedin.com/in/aparna-pradhan-06b882215/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-transform duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <FiLinkedin className="w-7 h-7" />
              </a>
              <a
                href="https://x.com/Aparna_108_dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-transform duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <FiTwitter className="w-7 h-7" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
