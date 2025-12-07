'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Send, Bot, User, X, MessageCircle, Briefcase, Calendar,
  DollarSign, Loader2, Trash2
} from "lucide-react";
import './chatbot.css'; // Import structure styles
import { useChat } from "./useChat";
import ChatMessage from "./ChatMessage";

const ChatbotComponent = ({
  onClose,
  onMinimize,
  isMinimized = false,
  isMobile = false,
}) => {
  // Use custom hook for logic
  const { messages, sendMessage, isLoading, isStreaming, error, connectionStatus, clearHistory } = useChat();

  // Local UI state
  const [input, setInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom with smooth behavior
  useEffect(() => {
    if (chatRef.current) {
      const scrollElement = chatRef.current;
      const isNearBottom = scrollElement.scrollTop + scrollElement.clientHeight >= scrollElement.scrollHeight - 100;
      
      if (isNearBottom || isStreaming) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: isStreaming ? 'auto' : 'smooth'
        });
      }
    }
  }, [messages, isStreaming]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Hide quick actions if conversation progresses
  useEffect(() => {
    if (messages.length > 2) {
      setShowQuickActions(false);
    }
  }, [messages.length]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    setShowQuickActions(false);
    
    // Focus input after send for better UX
    setTimeout(() => inputRef.current?.focus(), 100);

    await sendMessage(message);
  };

  const handleQuickAction = useCallback(async (text) => {
    setInput('');
    setShowQuickActions(false);
    await sendMessage(text);
  }, [sendMessage]);

  const QuickActions = useMemo(() => {
    if (!showQuickActions || isLoading || messages.length > 3) return null;

    const actions = [
      { text: "Automation", icon: <Bot className="w-4 h-4" />, intent: "automation", color: "from-blue-500 to-purple-500" },
      { text: "Pricing", icon: <DollarSign className="w-4 h-4" />, intent: "pricing", color: "from-green-500 to-emerald-500" },
      { text: "Book Demo", icon: <Calendar className="w-4 h-4" />, intent: "demo", color: "from-orange-500 to-red-500" },
      { text: "Contact", icon: <MessageCircle className="w-4 h-4" />, intent: "contact", color: "from-purple-500 to-pink-500" }
    ];

    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        {actions.map((action, index) => (
          <button
            key={`${action.intent}-${index}`}
            onClick={() => handleQuickAction(action.text)}
            className={`group flex flex-col items-center justify-center space-y-1 px-2 py-3 bg-gradient-to-r ${action.color} bg-opacity-10 hover:bg-opacity-20 text-gray-300 hover:text-white border border-gray-700/30 hover:border-gray-600/50 rounded-xl text-xs transition-all duration-200 min-h-[60px] backdrop-blur-sm hover:shadow-lg active:scale-[0.98]`}
            disabled={isLoading}
          >
            <span className="group-hover:scale-110 transition-transform duration-200 mb-1">
              {action.icon}
            </span>
            <span className="text-center font-medium leading-tight">{action.text}</span>
          </button>
        ))}
      </div>
    );
  }, [showQuickActions, isLoading, messages.length, handleQuickAction]);

  return (
    <div className="chatbot-wrapper">
      <div
        className={`chatbot-container relative border border-gray-600/70 shadow-2xl transition-all duration-300 ${isMobile ? 'bg-gray-900' : 'bg-gray-900/98 backdrop-blur-xl'
          } ${isMinimized ? 'cursor-pointer hover:bg-gray-800/95' : ''}`}
        onClick={isMinimized ? onMinimize : undefined}
        role="complementary"
        aria-label={isMinimized ? "Minimized chat window" : "AI Business Assistant Chat Window"}
        style={{ zIndex: 10 }}
      >
        {/* Header */}
        <header className={`flex items-center justify-between border-b border-gray-600/70 bg-gradient-to-r from-gray-900/90 to-gray-800/90 backdrop-blur-sm ${isMinimized ? 'p-3' : 'p-4'
          }`}>
          <div className="flex items-center space-x-3">
            <div className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${isMinimized ? 'p-1.5' : 'p-2'
              }`} aria-hidden="true">
              <Bot className={`text-white ${isMinimized ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </div>
            {!isMinimized && (
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  AI Assistant
                </h2>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-300">Ask about automation & AI</p>
                  {connectionStatus !== 'connected' && (
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                      connectionStatus === 'error' ? 'bg-red-400' : 'bg-green-400'
                    }`} title={connectionStatus} />
                  )}
                </div>
              </div>
            )}
          </div>

          {!isMinimized && (
            <button
              onClick={onClose}
              className="p-2 text-gray-300 hover:text-red-300 rounded-full hover:bg-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-400/70 transition-all duration-200 hover:scale-110"
              aria-label="Close chat window"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Messages Area */}
        {!isMinimized && (
          <main
            ref={chatRef}
            className="chat-messages-container overflow-y-auto custom-scrollbar space-y-4"
            style={{
              padding: isMobile ? '0.75rem' : '1rem'
            }}
          >
            {QuickActions}

            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                isStreaming={isStreaming && index === messages.length - 1}
                isMobile={isMobile}
              />
            ))}

            {/* Loading/Error States */}
            {isLoading && !isStreaming && (
              <div className="flex items-center justify-start space-x-3 p-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1.5 flex-shrink-0">
                  <Bot className="w-full h-full text-white" />
                </div>
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center p-2 text-red-400 text-xs">
                {error}
              </div>
            )}
          </main>
        )}

        {/* Input Area */}
        {!isMinimized && (
          <footer className={`chatbot-input-area ${isMobile ? 'p-3' : 'p-4'
            }`}>
            <form onSubmit={handleFormSubmit} className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isMobile ? "Ask about AI..." : "Tell me about your business..."}
                  className="chat-input-enhanced"
                  rows="1"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || input.trim().length < 2}
                  className="send-button"
                  title={!input.trim() ? 'Type a message to send' : input.trim().length < 2 ? 'Please write at least 2 characters' : 'Send message (Enter)'}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </form>

            {/* Footer Links */}
            <div className={`mt-3 flex gap-2 ${isMobile ? 'flex-col items-center' : 'flex-row items-center justify-between'
              }`}>
              <p className="text-xs text-gray-300 text-center">
                💬 Personalized AI assistance
              </p>
              <div className="flex items-center space-x-4">
                {messages.length > 1 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs text-gray-400 hover:text-gray-200 flex items-center space-x-1 transition-colors"
                    title="Clear chat history"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
                <a
                  href="mailto:softservicesinc.portfolio@gmail.com"
                  className="text-xs text-blue-300 hover:text-blue-200 flex items-center space-x-1 hover:underline"
                >
                  <Send className="w-3 h-3" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default ChatbotComponent;