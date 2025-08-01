'use client';

import { FaRobot, FaBrain, FaRocket } from 'react-icons/fa';
import { PricingCard } from './PricingCard';

export const UpworkPricing = () => {
  return (
    <div className="space-y-12">
      <div>
        <h3 className="text-2xl font-bold text-center mb-8 text-white">Upwork Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <PricingCard 
            title="Business Process Automation Scripts"
            price="$72 - $216"
            description="Reliable automation that just works - built by a production developer."
            features={[
              '$15-18/hour (8-12 hours total)',
              'Single-purpose agents',
              'API integrations',
              'Data processing scripts'
            ]}
            buttonText="Hire on Upwork"
            buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            platform="upwork"
            icon={FaRobot}
          />

          <PricingCard 
            title="AI-Powered Business Intelligence System"
            price="$216 - $540"
            description="Custom AI that understands your specific business needs."
            features={[
              '$18-24/hour (12-22 hours total)',
              'Multi-tool integrations',
              'Intelligent agents',
              'Basic dashboards'
            ]}
            isPopular
            buttonText="Hire on Upwork"
            buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            platform="upwork"
            icon={FaBrain}
          />

          <PricingCard 
            title="Enterprise AI Agent Orchestration"
            price="$540 - $1080"
            description="Production-grade AI infrastructure that scales with your business."
            features={[
              'Fixed Price or $24-30/hour',
              'Multi-agent systems',
              'Complex workflows',
              'Real-time dashboards'
            ]}
            buttonText="Hire on Upwork"
            buttonHref="https://www.upwork.com/freelancers/~014d5acd58cf68bfa9"
            platform="upwork"
            icon={FaRocket}
          />
        </div>
      </div>
    </div>
  );
};

export default UpworkPricing;
