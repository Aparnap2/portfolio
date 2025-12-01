'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { useResponsive } from '../../../hooks/useResponsive';
import { useChatbotPerformance } from '../../../hooks/useChatbotPerformance';
import ChatbotComponent from './ChatbotComponent';

const Chatbot = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Use responsive hook for better device detection
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    width, 
    height, 
    isTouch, 
    prefersReducedMotion,
    getResponsiveValue 
  } = useResponsive();
  
  // Performance monitoring - use stable callback to prevent infinite loops
  const handleMetric = useCallback((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Chatbot Metric:', metric);
    }
  }, []);

  const {
    trackEngagement,
    trackError,
    getMetrics
  } = useChatbotPerformance({
    enableMetrics: process.env.NODE_ENV === 'development',
    onMetric: handleMetric
  });
  
  const handleToggleChat = useCallback((e) => {
    e?.stopPropagation();
    
    try {
      setIsChatbotOpen(prev => {
        const newState = !prev;
        trackEngagement(newState ? 'chat_opened' : 'chat_closed', {
          method: 'button_click',
          device: isMobile ? 'mobile' : 'desktop'
        });
        return newState;
      });
      setIsMinimized(false);
    } catch (error) {
      trackError(error, 'toggle_chat');
    }
  }, [isMobile, trackEngagement, trackError]);
  
  const handleMinimize = useCallback((e) => {
    e?.stopPropagation();
    
    try {
      setIsMinimized(prev => {
        const newState = !prev;
        trackEngagement(newState ? 'chat_minimized' : 'chat_restored');
        return newState;
      });
    } catch (error) {
      trackError(error, 'minimize_chat');
    }
  }, [trackEngagement, trackError]);
  
  const handleClose = useCallback(() => {
    try {
      trackEngagement('chat_closed', { method: 'close_button' });
      setIsChatbotOpen(false);
      setIsMinimized(false);
    } catch (error) {
      trackError(error, 'close_chat');
    }
  }, [trackEngagement, trackError]);

  // Track user interactions for analytics
  useEffect(() => {
    if (isChatbotOpen) {
      trackEngagement('chatbot_opened', {
        device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        screenSize: { width, height }
      });
    }
  }, [isChatbotOpen, isMobile, isTablet, width, height, trackEngagement]);

  // Enhanced accessibility with proper ARIA support and focus management
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle keyboard navigation properly
      if (e.key === 'Escape' && isChatbotOpen) {
        e.preventDefault();
        handleToggleChat(e);
        // Return focus to the chat button after closing
        const chatButton = document.querySelector('[aria-label*="AI assistant"]');
        if (chatButton) {
          chatButton.focus();
        }
      }

      // Enhanced Tab navigation with proper focus trap
      if (e.key === 'Tab' && isChatbotOpen) {
        const chatContainer = document.querySelector('[role="dialog"]');
        if (!chatContainer) return;

        const focusableElements = chatContainer.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || !chatContainer.contains(document.activeElement)) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement || !chatContainer.contains(document.activeElement)) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    // Add keyboard event listener with proper cleanup
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatbotOpen, handleToggleChat]);
  
  // Prevent body scroll when chatbot is open (mobile only)
  useEffect(() => {
    if (isMobile && isChatbotOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.width = 'unset';
    };
  }, [isChatbotOpen, isMobile]);
  
  // Responsive animation variants with accessibility support
  const chatButtonVariants = useMemo(() => {
    const baseVariants = {
      initial: { scale: 0.8, opacity: 0 },
      animate: { 
        scale: 1, 
        opacity: 1,
        transition: { 
          type: 'spring',
          stiffness: 500,
          damping: 25,
          duration: prefersReducedMotion ? 0.1 : 0.3
        }
      },
      tap: { 
        scale: 0.95,
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 20,
          duration: prefersReducedMotion ? 0.05 : 0.15
        }
      }
    };
    
    // Only add hover effects for non-touch devices
    if (!isTouch && !prefersReducedMotion) {
      baseVariants.hover = {
        scale: getResponsiveValue({ xs: 1, md: 1.05 }),
        transition: { 
          type: 'spring',
          stiffness: 400,
          damping: 10
        }
      };
    }
    
    return baseVariants;
  }, [isTouch, prefersReducedMotion, getResponsiveValue]);
  
  // Responsive container variants with accessibility support
  const containerVariants = useMemo(() => {
    const duration = prefersReducedMotion ? 0.1 : getResponsiveValue({ xs: 0.2, md: 0.3 });
    
    return {
      hidden: { 
        opacity: 0, 
        scale: prefersReducedMotion ? 1 : 0.9, 
        y: prefersReducedMotion ? 0 : getResponsiveValue({ xs: 50, md: 20 }),
        transition: { duration: duration * 0.7 }
      },
      visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: {
          duration,
          ease: "easeOut"
        }
      },
      minimized: {
        opacity: 0.8,
        scale: prefersReducedMotion ? 1 : 0.95,
        y: prefersReducedMotion ? 0 : 10,
        transition: { duration: duration * 0.7 }
      }
    };
  }, [prefersReducedMotion, getResponsiveValue]);

  return (
    <div className={`fixed z-40 ${
      isMobile
        ? 'bottom-4 right-4'
        : 'bottom-4 right-4 sm:bottom-6 sm:right-6'
    }`} role="complementary" aria-label="AI Assistant Chat">
      <AnimatePresence mode="wait">
        {isChatbotOpen && (
          <motion.div
            className="relative"
            variants={containerVariants}
            initial="hidden"
            animate={isMinimized ? "minimized" : "visible"}
            exit="hidden"
            role="dialog"
            aria-modal="true"
            aria-label="AI Business Assistant"
            aria-describedby="chatbot-description"
          >
            <span id="chatbot-description" className="sr-only">
              Chat with Aparna&apos;s AI assistant to explore AI automation solutions for your business
            </span>
            <ChatbotComponent
              onClose={handleClose}
              onMinimize={handleMinimize}
              isMinimized={isMinimized}
              isMobile={isMobile}
              isTablet={isTablet}
              isDesktop={isDesktop}
              isTouch={isTouch}
              prefersReducedMotion={prefersReducedMotion}
              windowSize={{ width, height }}
              performanceHooks={{ trackEngagement, trackError, getMetrics }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced floating action button with better accessibility */}
      <div className="relative">
        <motion.button
          onClick={handleToggleChat}
          className={`relative rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl flex items-center justify-center group focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-gray-900/50 ${
            isMobile
              ? 'w-14 h-14 active:scale-95'
              : 'w-16 h-16 hover:shadow-2xl'
          }`}
          aria-label={isChatbotOpen ? "Close AI assistant chat" : "Open AI assistant chat"}
          aria-expanded={isChatbotOpen}
          aria-controls="chatbot-dialog"
          aria-haspopup="dialog"
          variants={chatButtonVariants}
          initial="initial"
          animate="animate"
          whileHover={!isMobile ? "hover" : {}}
          whileTap="tap"
        >
          {/* Notification pulse when chat is closed - with better contrast */}
          {!isChatbotOpen && (
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              aria-hidden="true"
            />
          )}
          
          {/* Icon with smooth transition */}
          <motion.span
            key={`icon-${isChatbotOpen}`}
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{
              opacity: 1,
              rotate: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 500,
                damping: 25
              }
            }}
            exit={{
              opacity: 0,
              rotate: 90,
              scale: 0.8,
              transition: {
                duration: 0.15
              }
            }}
            className="flex items-center justify-center"
          >
            {isChatbotOpen ? (
              <X className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />
            ) : (
              <MessageSquare className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} />
            )}
          </motion.span>
          
          {/* Enhanced tooltip - only show on desktop with better contrast */}
          {!isMobile && (
            <motion.div
              className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none shadow-xl border border-gray-600/70"
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              whileHover={{ opacity: 1, y: 0, scale: 1 }}
              role="tooltip"
              id="chatbot-tooltip"
            >
              {isChatbotOpen ? 'Close AI Assistant' : 'Chat with AI Assistant'}
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
            </motion.div>
          )}
        </motion.button>
        
        {/* Minimize button when chat is open - with better accessibility */}
        {isChatbotOpen && !isMobile && (
          <motion.button
            key={`minimize-${isMinimized}`}
            onClick={handleMinimize}
            className="absolute -top-2 -left-2 w-8 h-8 bg-gray-700/90 hover:bg-gray-600/90 text-white rounded-full flex items-center justify-center shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400/70 focus:ring-offset-1 focus:ring-offset-gray-900/50"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ delay: 0.2 }}
            aria-label={isMinimized ? "Restore chat window" : "Minimize chat window"}
            title={isMinimized ? "Restore chat window" : "Minimize chat window"}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default Chatbot;