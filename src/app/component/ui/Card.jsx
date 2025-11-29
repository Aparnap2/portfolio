import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  ...props 
}) => {
  const variants = {
    default: 'bg-gray-900/50 border-gray-700/50',
    glass: 'bg-gray-900/30 border-gray-700/30 backdrop-blur-sm',
    solid: 'bg-gray-800 border-gray-700',
    gradient: 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 border-gray-700/50'
  };

  return (
    <motion.div
      className={`
        border rounded-xl p-6 transition-all duration-200
        ${variants[variant]} ${className}
      `}
      whileHover={hover ? { y: -2, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' } : {}}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;