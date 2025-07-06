"use client";
import { FiMail, FiMapPin, FiLinkedin, FiTwitter } from 'react-icons/fi';
import { spaceGrotesk, firaCode } from '../fonts'; // Adjusted path assuming fonts.js is in src/app

const ContactSection = () => {
  return (
    <section id="contact" className="relative pt-20 pb-32 sm:pt-24 sm:pb-40 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>
            Ready to Transform Your Business with AI?
          </h2>
          <p className={`text-lg text-gray-300 max-w-2xl mx-auto ${firaCode.className}`}>
            I&#39;m here to help you navigate the world of AI and build solutions that make an impact.
          </p>
        </div>

        <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 p-6 sm:p-8 lg:p-10 shadow-xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className={`text-2xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>Get in Touch</h3>
              <p className="text-gray-300 mb-6">
                Have a project in mind or want to discuss how AI can benefit your business?
                I&#39;m here to help you navigate the world of AI and build solutions that make an impact.
              </p>

              <div className="space-y-4 mb-6">
                <a
                  href="mailto:softservicesinc.portfolio@gmail.com"
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <FiMail className="w-5 h-5 mr-3 text-orange-400" />
                  softservicesinc.portfolio@gmail.com
                </a>
                <a
                  href="https://goo.gl/maps/SQUjHtzSMfeZfmWR7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-300 hover:text-white transition-colors"
                >
                  <FiMapPin className="w-5 h-5 mr-3 text-orange-400" />
                  West Bengal, India
                </a>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-white mb-3">Connect with me</h4>
                <div className="flex space-x-4">
                  <a
                    href="https://www.linkedin.com/in/aparna-pradhan-06b882215/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-600 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                    aria-label="LinkedIn"
                  >
                    <FiLinkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="https://x.com/Aparna_108_dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-blue-400 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
                    aria-label="Twitter"
                  >
                    <FiTwitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-orange-900/30 p-6 sm:p-8 rounded-xl border border-purple-500/30 h-full flex flex-col justify-center backdrop-blur-sm shadow-lg">
              <h4 className={`text-xl font-bold text-white mb-4 ${spaceGrotesk.className}`}>Send Me a Message</h4>
              <p className="text-gray-300 mb-6">
                Have a project in mind or questions about my services? Feel free to reach out through email or any of my social media channels.
              </p>
              <a
                href="mailto:softservicesinc.portfolio@gmail.com"
                className="inline-flex items-center justify-center w-full px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-orange-500/30"
              >
                <FiMail className="w-5 h-5 mr-2" />
                Send Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
