'use client';

import { FaRobot, FaLaptopCode, FaServer, FaShieldAlt, FaTachometerAlt, FaCode, FaTools, FaHeadset } from 'react-icons/fa';
import { PricingCard } from './PricingCard';

export const FiverrPricing = () => {
  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-2xl font-bold text-center mb-8 text-white">Custom AI Solutions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <PricingCard 
            title="Basic RAG Chatbot"
            price="$107"
            description="AI chatbot with RAG capabilities"
            features={[
              'Document search (PDFs, websites)',
              '3-day delivery',
              '3 Revisions',
              'Source code included',
              'Setup file',
              'Detailed code comments'
            ]}
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaRobot}
          />

          <PricingCard 
            title="Full AI Web App"
            price="$214"
            description="Custom AI app with your business data"
            features={[
              'Custom AI web application',
              '5-day delivery',
              '5 Revisions',
              'Source code included',
              'Deployment support',
              'Basic documentation',
              '1 month support'
            ]}
            isPopular
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaLaptopCode}
          />

          <PricingCard 
            title="Multi-Agent Platform"
            price="$429"
            description="Advanced AI application with multiple agents"
            features={[
              'Multi-agent system',
              '7-day delivery',
              'Unlimited Revisions',
              'Source code included',
              'Deployment support',
              'Detailed documentation',
              '3 months support'
            ]}
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaServer}
          />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-center mb-8 text-white">AI Chatbot Solutions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <PricingCard 
            title="Starter Bot"
            price="$64"
            description="Simple AI chatbot with basic features"
            features={[
              '3-day delivery',
              '3 Revisions',
              'AI LLM model integration',
              'Web or React Native integration',
              'Basic documentation'
            ]}
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/dDj1ydg"
            platform="fiverr"
            icon={FaRobot}
          />

          <PricingCard 
            title="Smart Agent"
            price="$129"
            description="Conversational AI with advanced features"
            features={[
              '5-day delivery',
              '5 Revisions',
              'Web or React Native integration',
              'Chat history',
              'Basic analytics',
              '1 month support'
            ]}
            isRecommended
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/dDj1ydg"
            platform="fiverr"
            icon={FaLaptopCode}
          />

          <PricingCard 
            title="Advanced AI"
            price="$268"
            description="Advanced AI chatbot with workflows"
            features={[
              '7-day delivery',
              'Unlimited Revisions',
              'Multi-platform integration',
              'Advanced analytics',
              '3 months support',
              'Custom workflows',
              'API access'
            ]}
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/dDj1ydg"
            platform="fiverr"
            icon={FaServer}
          />
        </div>
      </div>

      <div className="backdrop-blur-sm bg-gradient-to-br from-purple-900/30 to-orange-500/20 rounded-2xl p-6 sm:p-8 border border-purple-500/30">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-xl font-semibold mb-4 text-orange-400 flex items-center">
              <FaShieldAlt className="mr-2" />
              Why Choose Fiverr?
            </h4>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start">
                <FaTachometerAlt className="text-orange-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Fast Turnaround</span>
                  <p className="text-sm text-gray-400">Quick project start and delivery with Fiverr&apos;s streamlined process</p>
                </div>
              </li>
              <li className="flex items-start">
                <FaCode className="text-orange-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Fixed Pricing</span>
                  <p className="text-sm text-gray-400">Clear, upfront pricing with no hidden costs</p>
                </div>
              </li>
              <li className="flex items-start">
                <FaTools className="text-orange-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Secure Payments</span>
                  <p className="text-sm text-gray-400">Your payment is protected until you approve the work</p>
                </div>
              </li>
              <li className="flex items-start">
                <FaHeadset className="text-orange-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">24/7 Support</span>
                  <p className="text-sm text-gray-400">Round-the-clock customer service for any assistance</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-purple-800/30 to-orange-900/20 p-6 rounded-lg border border-purple-500/30">
            <h5 className="font-medium text-orange-400 mb-4 text-lg">Ideal For:</h5>
            <div className="flex flex-wrap gap-3">
              <span className="bg-orange-900/50 text-orange-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaTachometerAlt className="mr-1" /> Quick Projects
              </span>
              <span className="bg-orange-900/50 text-orange-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaCode className="mr-1" /> Fixed Budgets
              </span>
              <span className="bg-orange-900/50 text-orange-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaTools className="mr-1" /> Standard Solutions
              </span>
              <span className="bg-orange-900/50 text-orange-300 text-xs px-4 py-2 rounded-full flex items-center">
                <FaHeadset className="mr-1" /> Fast Turnaround
              </span>
            </div>
            <div className="mt-6 p-4 bg-black/30 rounded-lg border border-purple-500/30">
              <p className="text-sm text-gray-300 mb-3">All Fiverr orders include:</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure payment
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Money-back guarantee
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 customer support
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiverrPricing;
