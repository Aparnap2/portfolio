'use client';

import { FaRobot, FaBrain, FaRocket } from 'react-icons/fa';
import { PricingCard } from './PricingCard';

export const UpworkPricing = () => {
  return (
    <div className="bg-gradient-to-br from-blue-900/10 to-green-800/5 p-8 rounded-2xl border border-green-600/20">
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 rounded-lg">
          <svg className="inline-block mr-3 w-6 h-6" viewBox="0 0 32 32" fill="white">
            <path d="M24.75 17.6429C24.75 17.6429 26.7 17.5571 27.2 17.5571C26.7 17.9 26.2 18.3286 25.7 18.7571C23.3 20.7 18.55 24.5 18.55 24.5L15.5 16.2L18.8 7.5H24.05L22.5 12.5H28L29.5 7.5H32L28.7 16.2L31.5 21.5H28.95L24.75 17.6429Z"/>
            <path d="M12.55 24.5L9.5 16.2L12.8 7.5H18.05L16.5 12.5H22L23.5 7.5H25.8L22.5 16.2L25.8 24.5H20.5L18.55 17.6L16.5 24.5H12.55Z"/>
            <path d="M8.5 7.5L4 24.5H0L4.5 7.5H8.5Z"/>
          </svg>
          <h3 className="text-2xl font-bold text-white inline">Available on Upwork</h3>
        </div>
      </div>
      <p className="text-center text-gray-300 mb-8 max-w-2xl mx-auto">
        Professional service with direct communication, milestone payments, and Upwork&apos;s payment protection.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <PricingCard 
          title="Contact Form Automation"
          price="$100 - $300"
          description="Smart inquiry categorization with CRM integration and advanced routing."
          features={[
            '✅ Advanced categorization logic',
            '✅ CRM integration (HubSpot, Salesforce)',
            '✅ Custom response templates',
            '✅ 2-3 days delivery',
            '✅ Upwork payment protection'
          ]}
          buttonText="Hire on Upwork"
          buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
          platform="upwork"
          icon={FaRobot}
        />

        <PricingCard 
          title="E-commerce Customer Service"
          price="$200 - $500"
          description="Complete automation with analytics dashboard and advanced features."
          features={[
            '✅ Order status + shipping automation',
            '✅ Returns/refunds handling',
            '✅ Analytics dashboard',
            '✅ 3-5 days delivery',
            '✅ Custom branding & styling'
          ]}
          isPopular
          buttonText="Hire on Upwork"
          buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
          platform="upwork"
          icon={FaBrain}
        />

        <PricingCard 
          title="Custom Business Automation"
          price="$150 - $800"
          description="Tailored solutions for unique workflows with consultation and documentation."
          features={[
            '✅ Free 15-minute consultation',
            '✅ Custom workflow analysis',
            '✅ Multi-platform integrations',
            '✅ 1-2 weeks delivery',
            '✅ Full documentation & training'
          ]}
          buttonText="Hire on Upwork"
          buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
          platform="upwork"
          icon={FaRocket}
        />
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          🔒 All Upwork projects include: Escrow protection • Milestone payments • Dispute resolution • Quality guarantee
        </p>
      </div>
    </div>
  );
};

export default UpworkPricing;