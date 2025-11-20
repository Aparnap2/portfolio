'use client';

import { FaRobot, FaLaptopCode, FaServer } from 'react-icons/fa';
import { PricingCard } from './PricingCard';

export const FiverrPricing = () => {
  return (
    <div className="bg-gradient-to-br from-green-900/10 to-green-800/5 p-8 rounded-2xl border border-green-500/20">
      <div className="flex items-center justify-center mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-3 rounded-lg">
          <svg className="inline-block mr-3 w-6 h-6" viewBox="0 0 24 24" fill="white">
            <path d="M19.5 15.5C19.5 17.16 18.16 18.5 16.5 18.5C14.84 18.5 13.5 17.16 13.5 15.5C13.5 13.84 14.84 12.5 16.5 12.5C18.16 12.5 19.5 13.84 19.5 15.5Z"/>
            <path d="M10.5 15.5C10.5 17.16 9.16 18.5 7.5 18.5C5.84 18.5 4.5 17.16 4.5 15.5C4.5 13.84 5.84 12.5 7.5 12.5C9.16 12.5 10.5 13.84 10.5 15.5Z"/>
            <path d="M15 8.5C15 10.16 13.66 11.5 12 11.5C10.34 11.5 9 10.16 9 8.5C9 6.84 10.34 5.5 12 5.5C13.66 5.5 15 6.84 15 8.5Z"/>
          </svg>
          <h3 className="text-2xl font-bold text-white inline">Available on Fiverr</h3>
        </div>
      </div>
      <p className="text-center text-gray-300 mb-8 max-w-2xl mx-auto">
        Fixed pricing, fast delivery, perfect for small businesses getting started with automation.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <PricingCard 
          title="Contact Form Automation"
          price="$75 - $200"
          description="Automatically sort inquiries by type and send personalized auto-replies."
          features={[
            '✅ Sort inquiries (sales, support, general)',
            '✅ Personalized auto-replies', 
            '✅ Route urgent requests to phone/email',
            '✅ 2-3 days delivery',
            '✅ Perfect for service businesses'
          ]}
          buttonText="Order on Fiverr"
          buttonHref="https://www.fiverr.com/s/5rozwpk"
          platform="fiverr"
          icon={FaRobot}
        />

        <PricingCard 
          title="E-commerce Order Bot"
          price="$150 - $350"
          description="Let customers check order status and handle returns automatically."
          features={[
            '✅ Order status checker',
            '✅ Automated shipping notifications',
            '✅ Simple returns/exchange handling',
            '✅ 3-5 days delivery',
            '✅ Reduces support emails by 70%'
          ]}
          isPopular
          buttonText="Order on Fiverr"
          buttonHref="https://www.fiverr.com/s/5rozwpk"
          platform="fiverr"
          icon={FaLaptopCode}
        />

        <PricingCard 
          title="FAQ Chatbot"
          price="$100 - $275"
          description="Smart chatbot that answers your 10-15 most common questions."
          features={[
            '✅ Handles 10-15 common questions',
            '✅ Works on website or email',
            '✅ Escalates complex issues with context',
            '✅ 2-4 days delivery',
            '✅ Reduces interruptions by 80%'
          ]}
          buttonText="Order on Fiverr"
          buttonHref="https://www.fiverr.com/s/5rozwpk"
          platform="fiverr"
          icon={FaServer}
        />
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          💡 All Fiverr orders include: Money-back guarantee • Source code ownership • No monthly fees
        </p>
      </div>
    </div>
  );
};

export default FiverrPricing;
