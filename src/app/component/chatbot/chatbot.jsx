'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import ChatbotComponent from './ChatbotComponent';

const Chatbot = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
  // Prevent body scroll when chatbot is open
  useEffect(() => {
    document.body.style.overflow = isChatbotOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isChatbotOpen]);

  const handleToggleChat = (e) => {
    e?.stopPropagation();
    setIsChatbotOpen(!isChatbotOpen);
  };
  
  // Animation variants for the chat button
  const chatButtonVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 25
      }
    },
    hover: { 
      scale: 1.05,
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.95,
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 20
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isChatbotOpen && (
          <motion.div 
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <ChatbotComponent onClose={() => setIsChatbotOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative transition-all duration-300 opacity-100">
        <motion.button
          onClick={handleToggleChat}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center"
          aria-label={isChatbotOpen ? "Close chat" : "Open chat"}
          variants={chatButtonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          <motion.span
            key={isChatbotOpen ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ 
              opacity: 1, 
              rotate: 0,
              transition: {
                type: 'spring',
                stiffness: 500,
                damping: 25
              }
            }}
            exit={{ 
              opacity: 0, 
              rotate: 90,
              transition: {
                type: 'spring',
                stiffness: 500,
                damping: 25
              }
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isChatbotOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <MessageSquare className="w-6 h-6" />
            )}
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
};

export default Chatbot;