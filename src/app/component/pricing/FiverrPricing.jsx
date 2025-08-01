'use client';

import { FaRobot, FaLaptopCode, FaServer } from 'react-icons/fa';
import { PricingCard } from './PricingCard';

export const FiverrPricing = () => {
  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-2xl font-bold text-center mb-8 text-white">Fiverr Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <PricingCard 
            title="AI Automation Agent for Your Workflow"
            price="$60 - $180"
            description="Get your first AI agent working in under a week - no monthly fees, you own the code."
            features={[
              '3-5 days delivery',
              'Inbox organizer',
              'WhatsApp auto-responder',
              'Basic lead scraper',
              'Google Sheets automation'
            ]}
            buttonText="Order on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaRobot}
          />

          <PricingCard 
            title="Multi-Platform AI Agent System"
            price="$180 - $480"
            description="Complete lead-to-close automation across LinkedIn, email, and your CRM."
            features={[
              '1-2 weeks delivery',
              'LinkedIn scraper + lead qualifier',
              'Multi-channel automation',
              'Custom dashboard'
            ]}
            isPopular
            buttonText="Order on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaLaptopCode}
          />

          <PricingCard 
            title="Custom Multi-Agent Business Platform"
            price="$480 - $1320"
            description="Your personal AI workforce - multiple agents working together."
            features={[
              '3-4 weeks delivery',
              'Full orchestration system',
              'Multiple agents',
              'Analytics dashboard'
            ]}
            buttonText="Order on Fiverr"
            buttonHref="https://www.fiverr.com/s/5rozwpk"
            platform="fiverr"
            icon={FaServer}
          />
        </div>
      </div>
    </div>
  );
};

export default FiverrPricing;
