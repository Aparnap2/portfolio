import { motion } from 'framer-motion';

const SectionDivider = ({ title, accent = 'purple' }) => {
  // Define different accent colors
  const accentColors = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    default: 'from-purple-500 to-pink-500'
  };

  const gradientColor = accentColors[accent] || accentColors.default;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 sm:my-24">
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-800/70"></div>
        {title && (
          <motion.div 
            className="mx-4 flex-shrink-0 relative"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className={`inline-block px-6 py-2 rounded-full text-sm font-semibold bg-gradient-to-r ${gradientColor} text-white shadow-lg`}>
              {title}
            </span>
          </motion.div>
        )}
        <div className="flex-grow border-t border-gray-800/70"></div>
      </div>
    </div>
  );
};

export default SectionDivider;
