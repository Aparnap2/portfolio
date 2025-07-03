'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ZapIcon } from 'lucide-react';
import ChatbotComponent from './ChatbotComponent';

const Chatbot = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true); // Animation indicator for initial state

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
    if (hasNewMessage) setHasNewMessage(false);
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
    <div className="fixed bottom-20 right-6 z-50 md:bottom-6">
      <AnimatePresence>
        {isChatbotOpen && (
          <motion.div 
            className="relative"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <ChatbotComponent onClose={() => setIsChatbotOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative transition-all duration-300 opacity-100">
        {/* New message indicator */}
        <AnimatePresence>
          {hasNewMessage && !isChatbotOpen && (
            <motion.div 
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <span className="text-xs font-bold text-white">1</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleToggleChat}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-xl hover:shadow-purple-500/20 flex items-center justify-center border border-purple-500/20"
          aria-label={isChatbotOpen ? "Close chat" : "Open chat"}
          variants={chatButtonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
        >
          {/* Background pulse effect */}
          <AnimatePresence>
            {!isChatbotOpen && hasNewMessage && (
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500/20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0, 0.7]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
              />
            )}
          </AnimatePresence>

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

        {/* Button label */}
        <AnimatePresence>
          {!isChatbotOpen && (
            <motion.div 
              className="absolute -left-24 top-1/2 transform -translate-y-1/2 bg-gray-800/90 backdrop-blur-sm px-3 py-1.5 rounded-lg hidden md:block"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: 1, duration: 0.2 }}
            >
              <span className="text-sm text-white">Ask me anything</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Chatbot;