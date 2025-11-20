'use client';

import { motion } from 'framer-motion';

export const PricingCard = ({
  title,
  price,
  description,
  features,
  buttonText,
  buttonHref,
  platform = 'fiverr',
  icon: Icon,
  isPopular = false,
  isRecommended = false,
}) => {
  // Platform specific styles
  const platformStyles = {
    fiverr: {
      gradient: 'from-purple-900/40 to-orange-500/20',
      border: 'border-purple-500/30',
      button: 'from-orange-500 to-pink-500 hover:shadow-orange-500/20',
      highlight: 'bg-orange-500',
      text: 'text-orange-400',
    },
    upwork: {
      gradient: 'from-green-900/40 to-green-700/30',
      border: 'border-green-500/30',
      button: 'from-green-600 to-green-700 hover:shadow-green-500/20',
      highlight: 'bg-green-500',
      text: 'text-green-400',
    },
  };

  const styles = platformStyles[platform] || platformStyles.fiverr;

  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative h-full flex flex-col backdrop-blur-sm bg-white/5 rounded-xl border ${styles.border} overflow-hidden transition-all duration-300 hover:shadow-lg`}
    >
      {/* Glow effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${styles.gradient} rounded-xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200`}></div>
      
      <div className="relative flex-1 flex flex-col p-6 sm:p-8 bg-gray-900/80 rounded-xl">
        {/* Badge */}
        {(isPopular || isRecommended) && (
          <div className={`absolute top-4 right-4 ${styles.highlight} text-white text-xs font-bold px-3 py-1 rounded-full z-10`}>
            {isPopular ? 'POPULAR' : 'RECOMMENDED'}
          </div>
        )}

        {/* Icon */}
        {Icon && (
          <div className={`w-12 h-12 ${styles.text} mb-4`}>
            <Icon className="w-full h-full" />
          </div>
        )}

        {/* Title & Price */}
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <div className={`text-3xl font-bold ${styles.text} mb-4 sm:mb-6`}>
          {price}
        </div>
        
        {/* Description */}
        <p className="text-gray-300 mb-6">{description}</p>
        
        {/* Features */}
        <ul className="space-y-3 mb-6 sm:mb-8 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <svg className={`w-5 h-5 ${styles.text} mt-0.5 mr-2 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Button */}
        <a
          href={buttonHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto w-full text-center bg-gradient-to-r ${styles.button} text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 hover:opacity-90 hover:shadow-lg`}
        >
          {buttonText}
        </a>
      </div>
    </motion.div>
  );
};

export default PricingCard;