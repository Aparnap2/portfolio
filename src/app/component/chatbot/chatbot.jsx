'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  ArrowRight, 
  Menu, 
  Trash2, 
  RefreshCw 
} from 'lucide-react';
import ChatbotComponent from './ChatbotComponent';
import { usePortfolio } from '../../../context/PortfolioContext';

const Chatbot = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const chatButtonRef = useRef(null);
  const menuRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
  const { 
    showOnboarding, 
    completeOnboarding, 
    clearChatHistory, 
    chatHistory = [],
    isTyping = false,
    setIsTyping = () => {}
  } = usePortfolio();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Show toggle button after initial load
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          chatButtonRef.current && !chatButtonRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prevent body scroll when chatbot is open
  useEffect(() => {
    if (isChatbotOpen) {
      document.body.style.overflow = 'hidden';
      setShowMenu(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isChatbotOpen]);

  const handleGoalSelect = useCallback((goal) => {
    completeOnboarding(goal);
    setShowGoals(false);
    if (!isChatbotOpen) {
      setIsChatbotOpen(true);
    }
  }, [completeOnboarding, isChatbotOpen]);

  const handleClearChat = useCallback(() => {
    setIsClearing(true);
    setTimeout(() => {
      clearChatHistory();
      setShowMenu(false);
      setIsClearing(false);
    }, 300);
  }, [clearChatHistory]);

  const handleToggleChat = useCallback((e) => {
    e?.stopPropagation();
    const newState = !isChatbotOpen;
    setIsChatbotOpen(newState);
    
    if (newState && showOnboarding) {
      setShowGoals(true);
    } else {
      setShowGoals(false);
    }
  }, [isChatbotOpen, showOnboarding]);

  // Only render after component is mounted
  if (!isMounted) return null;
  
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
  
  // Animation variants for menu items
  const menuItemVariants = {
    closed: { opacity: 0, y: -10 },
    open: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 30
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
            <ChatbotComponent onClose={() => {
              setIsChatbotOpen(false);
              setShowGoals(false);
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={chatButtonRef}
        className={`relative transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Chatbot Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div 
              className="absolute bottom-20 right-0 mb-4 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 z-50"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-2">
                <button
                  onClick={handleClearChat}
                  disabled={isClearing || chatHistory.length === 0}
                  className={`w-full flex items-center px-4 py-2.5 text-sm rounded-lg transition-colors ${
                    isClearing || chatHistory.length === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                  }`}
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      <span>Clearing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Clear Chat History</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goal Selection Dropdown */}
        <AnimatePresence>
          {showGoals && (
            <motion.div 
              className="absolute bottom-20 right-0 mb-4 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 z-40"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white">How can I help you today?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose an option to get started</p>
              </div>
              <div className="p-2 space-y-2">
                <button
                  onClick={() => handleGoalSelect('hire')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Hire Me</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Discuss project opportunities</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
                <button
                  onClick={() => handleGoalSelect('collaborate')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Collaborate</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Work together on a project</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
                <button
                  onClick={() => handleGoalSelect('learn')}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Learn More</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ask about my work and skills</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Button */}
        <div className="flex items-center space-x-3">
          <AnimatePresence>
            {isChatbotOpen && (
              <motion.div 
                className="bg-white dark:bg-gray-800 shadow-lg rounded-full overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className={`p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    showMenu ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                  aria-label="Chat options"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              if (showOnboarding) {
                setShowGoals(!showGoals);
                setShowMenu(false);
              } else {
                handleToggleChat(e);
              }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center`}
            aria-label={isChatbotOpen ? "Close chat" : "Open chat"}
            variants={chatButtonVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
          >
            <motion.span
              key={isChatbotOpen ? 'close' : showGoals ? 'goals' : 'open'}
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
              ) : showGoals ? (
                <X className="w-6 h-6" />
              ) : (
                <MessageSquare className="w-6 h-6" />
              )}
            </motion.span>
            
            {isHovered && !isChatbotOpen && (
              <motion.span 
                className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
              >
                Ask me anything!
              </motion.span>
            )}
            
            {chatHistory.length > 1 && !isChatbotOpen && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {chatHistory.length - 1}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;