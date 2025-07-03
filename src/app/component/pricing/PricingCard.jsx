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
      gradient: 'from-purple-900/20 via-purple-900/5 to-orange-900/10',
      glow: 'from-purple-600/20 via-transparent to-orange-600/20',
      button: 'from-orange-500 to-pink-500 hover:shadow-xl hover:shadow-orange-500/20',
      highlight: 'bg-gradient-to-r from-orange-500 to-pink-500',
      text: 'text-orange-400',
      hoverGlow: 'hover:shadow-purple-500/10',
    },
    upwork: {
      gradient: 'from-green-900/20 via-green-900/5 to-emerald-900/10',
      glow: 'from-green-600/20 via-transparent to-emerald-600/20',
      button: 'from-green-600 to-emerald-600 hover:shadow-xl hover:shadow-green-500/20',
      highlight: 'bg-gradient-to-r from-green-600 to-emerald-600',
      text: 'text-green-400',
      hoverGlow: 'hover:shadow-green-500/10',
    },
  };

  const styles = platformStyles[platform] || platformStyles.fiverr;

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } }}
      className={`relative h-full flex flex-col overflow-hidden rounded-2xl transition-all duration-500 ${styles.hoverGlow}`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-90`}></div>
      
      {/* Subtle glow effect */}
      <div className={`absolute -inset-[1px] bg-gradient-to-r ${styles.glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      <div className="relative flex-1 flex flex-col p-8 bg-gradient-to-br from-gray-900/90 to-gray-900/70 backdrop-blur-sm">
        {/* Badge */}
        {(isPopular || isRecommended) && (
          <div className="absolute top-6 right-6">
            <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold tracking-wide rounded-full ${styles.highlight} text-white shadow-lg`}>
              {isPopular ? 'MOST POPULAR' : 'RECOMMENDED'}
            </span>
          </div>
        )}

        {/* Icon */}
        {Icon && (
          <div className={`w-14 h-14 mb-6 flex items-center justify-center rounded-xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm ${styles.text}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}

        {/* Title & Price */}
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <div className={`text-4xl font-bold mb-6 bg-gradient-to-r ${styles.text} bg-clip-text text-transparent`}>
          {price}
        </div>
        
        {/* Description */}
        <p className="text-gray-300 mb-8 leading-relaxed">{description}</p>
        
        {/* Divider */}
        <div className={`h-px w-full bg-gradient-to-r from-transparent via-${styles.text.split('text-')[1].split('-')[0]}-500/20 to-transparent mb-6`}></div>
        
        {/* Features */}
        <ul className="space-y-4 mb-8 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start group">
              <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg bg-gradient-to-br ${styles.gradient} mr-3 mt-0.5`}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-300 group-hover:text-white transition-colors duration-300">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Button */}
        <a
          href={buttonHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative mt-auto w-full text-center bg-gradient-to-r ${styles.button} text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-500 hover:shadow-xl hover:scale-[1.02] overflow-hidden group`}
        >
          <span className="relative z-10 flex items-center justify-center">
            {buttonText}
            <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </a>
      </div>
    </motion.div>
  );
};

export default PricingCard;