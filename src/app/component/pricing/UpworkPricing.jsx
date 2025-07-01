'use client';

import { FaRobot, FaBrain, FaRocket, FaBriefcase, FaClock, FaChartLine, FaHandshake, FaUserTie, FaCog, FaServer, FaTools, FaHeadset } from 'react-icons/fa';
import { PricingCard } from './PricingCard';

export const UpworkPricing = () => {
  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-2xl font-bold text-center mb-8 text-white">Professional AI Solutions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <PricingCard 
            title="Basic AI Chatbot"
            price="$45"
            description="Simple chatbot with basic Q&A capabilities"
            features={[
              '4 days delivery',
              '1 Revision',
              'Up to 10 conversation steps',
              '1 Messaging Platform',
              'Basic Q&A capabilities',
              'Bug fixes included'
            ]}
            buttonText="Hire on Upwork"
            buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            platform="upwork"
            icon={FaRobot}
          />

          <PricingCard 
            title="RAG-Enabled Chatbot"
            price="$120"
            description="Chatbot with RAG integration and multi-platform support"
            features={[
              '7 days delivery',
              '2 Revisions',
              'Up to 25 conversation steps',
              '2 Messaging Platforms',
              'Action Plan',
              'API Integration',
              'Chatbot Flow Design',
              'Conversation Script',
              'Bug fixes included'
            ]}
            isPopular
            buttonText="Hire on Upwork"
            buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            platform="upwork"
            icon={FaBrain}
          />

          <PricingCard 
            title="Advanced AI Agent"
            price="$250"
            description="Comprehensive AI agent with complex workflows and analytics"
            features={[
              '10 days delivery',
              '5 Revisions',
              'Up to 50 conversation steps',
              '3 Messaging Platforms',
              'Action Plan',
              'API Integration',
              'Chatbot Flow Design',
              'Conversation Script',
              'Advanced analytics',
              'Priority 24/7 support'
            ]}
            buttonText="Hire on Upwork"
            buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            platform="upwork"
            icon={FaRocket}
          />
        </div>
      </div>

      <div className="backdrop-blur-sm bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-2xl p-6 sm:p-8 border border-green-500/30">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
              <FaHandshake className="mr-2" />
              Why Choose Upwork?
            </h4>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <FaClock className="text-green-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Flexible Engagement</span>
                  <p className="text-sm text-gray-400">Hourly or fixed-price contracts to match your project needs</p>
                </div>
              </li>
              <li className="flex items-start">
                <FaUserTie className="text-green-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Professional Service</span>
                  <p className="text-sm text-gray-400">Dedicated professional for your project from start to finish</p>
                </div>
              </li>
              <li className="flex items-start">
                <FaCog className="text-green-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Custom Solutions</span>
                  <p className="text-sm text-gray-400">Tailored development to meet your specific requirements</p>
                </div>
              </li>
              <li className="flex items-start">
                <FaHeadset className="text-green-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Ongoing Support</span>
                  <p className="text-sm text-gray-400">Continued maintenance and support options available</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-green-800/30 to-green-900/20 p-6 rounded-lg border border-green-500/30">
            <h5 className="font-medium text-green-400 mb-4 text-lg">Ideal For:</h5>
            <div className="flex flex-wrap gap-3">
              <span className="bg-green-900/50 text-green-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaTools className="mr-1" /> Complex Projects
              </span>
              <span className="bg-green-900/50 text-green-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaClock className="mr-1" /> Long-term Work
              </span>
              <span className="bg-green-900/50 text-green-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaCog className="mr-1" /> Custom Solutions
              </span>
              <span className="bg-green-900/50 text-green-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaHeadset className="mr-1" /> Ongoing Support
              </span>
            </div>
            <div className="mt-6 p-4 bg-black/30 rounded-lg border border-green-500/30">
              <p className="text-sm text-gray-300 mb-3">All Upwork contracts include:</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Payment protection
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure escrow
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Time tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-gradient-to-br from-gray-800/30 to-gray-900/20 rounded-2xl p-8 border border-gray-700/50">
        <div className="text-center max-w-3xl mx-auto">
          <h4 className="text-2xl font-semibold mb-4 text-green-400">Need a Custom Solution?</h4>
          <p className="text-lg text-gray-300 mb-6">
            For projects that don&apos;t fit into standard packages, I offer custom development services tailored to your specific needs. 
            Contact me on Upwork to discuss your project requirements and get a personalized quote.
          </p>
          <a 
            href="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-green-500/20"
          >
            <FaBriefcase className="mr-2" />
            Discuss Your Project on Upwork
          </a>
        </div>
      </div>
    </div>
  );
};

export default UpworkPricing;
