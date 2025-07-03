import { motion } from 'framer-motion';

const SectionHeading = ({ title, subtitle, accent = 'purple', centered = true, className = '' }) => {
  // Define accent colors for the heading
  const accentColors = {
    purple: 'from-purple-400 to-pink-400',
    blue: 'from-blue-400 to-cyan-400',
    green: 'from-green-400 to-emerald-400',
    orange: 'from-orange-400 to-red-400',
    default: 'from-purple-400 to-pink-400'
  };

  const gradientColor = accentColors[accent] || accentColors.default;

  return (
    <motion.div 
      className={`mb-12 ${centered ? 'text-center' : ''} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        {title.split(' ').map((word, i, arr) => {
          // Apply gradient to the last word
          if (i === arr.length - 1) {
            return (
              <span key={i} className={`bg-gradient-to-r ${gradientColor} bg-clip-text text-transparent`}>
                {i > 0 ? ' ' : ''}{word}
              </span>
            );
          }
          return <span key={i}>{i > 0 ? ' ' : ''}{word}</span>;
        })}
      </h2>
      {subtitle && (
        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}

      {/* Optional decorative element */}
      <div className="mt-4 flex justify-center">
        <div className={`h-1 w-20 bg-gradient-to-r ${gradientColor} rounded-full ${!centered && 'ml-0 mr-auto'}`}></div>
      </div>
    </motion.div>
  );
};

export default SectionHeading;
