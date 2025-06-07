'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const PortfolioContext = createContext();

export const PortfolioProvider = ({ children }) => {
  const [visitorGoal, setVisitorGoal] = useState('');
  const [activeTab, setActiveTab] = useState('fiverr');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      sender: 'bot',
      message: 'Hi there! I\'m Aparna\'s AI assistant. What brings you here today?',
      timestamp: new Date().toISOString(),
      type: 'greeting'
    }
  ]);

  const completeOnboarding = (goal) => {
    setVisitorGoal(goal);
    setShowOnboarding(false);
    // Add a follow-up message based on the goal
    const followUps = {
      'hire': 'Great! Let me show you how I can help with your project. Would you like to see my portfolio or discuss your requirements?',
      'collaborate': 'Awesome! I\'d love to collaborate. What kind of project do you have in mind?',
      'learn': 'I\'d be happy to share my knowledge. What would you like to learn about?',
      'default': 'How can I assist you today? Feel free to ask about my projects, skills, or experience.'
    };
    
    addBotMessage(followUps[goal] || followUps['default']);
  };

  const addUserMessage = (message) => {
    const newMessage = {
      id: chatHistory.length + 1,
      sender: 'user',
      message,
      timestamp: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const addBotMessage = (message) => {
    const newMessage = {
      id: chatHistory.length + 1,
      sender: 'bot',
      message,
      timestamp: new Date().toISOString(),
      type: 'response'
    };
    setChatHistory(prev => [...prev, newMessage]);
  };

  const updateBotMessage = (id, message) => {
    setChatHistory(prevChatHistory => {
      // Find if the message with this ID exists
      const messageExists = prevChatHistory.some(msg => msg.id === id);
      
      if (!messageExists) {
        console.warn(`Message with ID ${id} not found`);
        return prevChatHistory;
      }
      
      return prevChatHistory.map((msg) => {
        if (msg.id === id) {
          return { ...msg, message };
        }
        return msg;
      });
    });
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setIsTyping(false);
  };

  return (
    <PortfolioContext.Provider 
      value={{ 
        visitorGoal, 
        activeTab, 
        setActiveTab, 
        showOnboarding, 
        completeOnboarding,
        chatHistory,
        addUserMessage,
        addBotMessage,
        updateBotMessage,
        clearChatHistory,
        isTyping,
        setIsTyping
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
