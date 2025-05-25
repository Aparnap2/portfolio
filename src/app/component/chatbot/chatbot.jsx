// components/chatbot/Chatbot.jsx
'use client';
import { useState, useEffect } from 'react';
import { Bot, MessageSquare, X } from 'lucide-react';
import ChatbotComponent from './ChatbotComponent';

const Chatbot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Show toggle button after initial load
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>
      {isChatbotOpen ? (
        <ChatbotComponent onClose={() => setIsChatbotOpen(false)} />
      ) : (
        <div className="relative">
          <div 
            className={`absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full transform transition-all duration-300 ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
            }`}
          >
            Need help?
          </div>
          <button
            onClick={() => setIsChatbotOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative p-4 bg-gradient-to-br from-orange-400 to-purple-500 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-110"
            style={{
              boxShadow: '0 8px 32px rgba(255, 152, 0, 0.2)'
            }}
          >
            {isHovered ? (
              <MessageSquare className="w-6 h-6 transition-transform group-hover:rotate-12" />
            ) : (
              <Bot className="w-6 h-6 transition-transform group-hover:scale-110" />
            )}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white" />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Chatbot;