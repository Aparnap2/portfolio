// components/chatbot/Chatbot.jsx
'use client';
import { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import ChatbotComponent from './ChatbotComponent';

const Chatbot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    // Show toggle button after initial load
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {isChatbotOpen ? (
        <ChatbotComponent onClose={() => setIsChatbotOpen(false)} />
      ) : (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="p-4 bg-accent1 text-primary rounded-full shadow-2xl hover:bg-accent2 transition-all duration-300 group hover:scale-110 hover:rotate-12"
          style={{
            boxShadow: '0 0 20px 5px rgba(100, 210, 255, 0.3)'
          }}
        >
          <Bot className="w-6 h-6 transition-transform group-hover:scale-125" />
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent2 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent2" />
          </span>
        </button>
      )}
    </div>
  );
};

export default Chatbot;