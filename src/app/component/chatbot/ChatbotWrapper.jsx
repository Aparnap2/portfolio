'use client'
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MessageCircle, X } from 'lucide-react';

// Dynamically import the full chatbot component
const ChatbotComponent = dynamic(
  () => import('./ChatbotComponent'),
  {
    loading: () => (
      <div className="fixed bottom-4 right-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center animate-pulse">
        <MessageCircle className="w-6 h-6 text-white" />
      </div>
    ),
    ssr: false
  }
);

const ChatbotWrapper = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  return (
    <>
      {/* Floating button - only shown when chat is closed or minimized */}
      {!isOpen && !isMinimized && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          aria-label="Open chatbot"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Minimized state - shows a small button */}
      {isMinimized && (
        <button
          onClick={handleOpen}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
          aria-label="Open chatbot"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Full chatbot component - only rendered when open */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatbotComponent
            onClose={handleClose}
            onMinimize={handleMinimize}
            isMinimized={isMinimized}
            isMobile={isMobile}
          />
        </div>
      )}
    </>
  );
};

export default ChatbotWrapper;