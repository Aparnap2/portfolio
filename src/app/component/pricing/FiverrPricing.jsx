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
            price="$108"
            description="Small chatbot with document search"
            features={[
              '5-day delivery',
              '1 Revision',
              'Functional AI Agent',
              'Agent Custom Development',
              'Source code',
              'Setup file'
            ]}
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaRobot}
          />

          <PricingCard 
            title="Full AI Web App"
            price="$216"
            description="Custom AI app with your business data"
            features={[
              '10-day delivery',
              '3 Revisions',
              'Functional AI Agent',
              'Agent Custom Development',
              'Source code',
              'Setup file',
              'Detailed code comments'
            ]}
            isPopular
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaLaptopCode}
          />

          <PricingCard 
            title="Multi-Agent AI Platform"
            price="$432"
            description="Advanced app with multiple AI agents working together"
            features={[
              '14-day delivery',
              '5 Revisions',
              'Functional AI Agent',
              'Agent Custom Development',
              'Source code',
              'Setup file',
              'Detailed code comments'
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
            price="$65"
            description="Simple AI chatbot (FAQ-style)"
            features={[
              '3-day delivery',
              '3 Revisions',
              'Web or React Native integration',
              'NO RAG, simple LLM',
              'AI LLM model integration'
            ]}
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/dDj1ydg"
            platform="fiverr"
            icon={FaRobot}
          />

          <PricingCard 
            title="Smart Agent"
            price="$130"
            description="Conversational AI with Langchain, pydantic"
            features={[
              '5-day delivery',
              '9 Revisions',
              'RAG integration (PDF or website)',
              'AI LLM model integration',
              'Retrieval-Augmented Generation (RAG)'
            ]}
            isRecommended
            buttonText="Order Now on Fiverr"
            buttonHref="https://www.fiverr.com/s/dDj1ydg"
            platform="fiverr"
            icon={FaLaptopCode}
          />

          <PricingCard 
            title="Advanced AI"
            price="$270"
            description="Agent + Workflows + RAG + integrations"
            features={[
              '10-day delivery',
              'Unlimited Revisions',
              'RAG + platform integration',
              'Database + Authentication + CRM',
              'Multi-language support',
              'Source Code included',
              'Priority support'
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
                  <p className="text-sm text-gray-400">Quick project start and delivery with Fiverr's streamlined process</p>
                </div>
              </li>
              <li className="flex items-start">
                <FaCode className="text-orange-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Fixed Pricing</span>
                  <p className="text-sm text-gray-400">Clear, upfront pricing with no hidden costs</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiverrPricing;
