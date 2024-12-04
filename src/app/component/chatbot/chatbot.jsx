import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { LucidePanelTopClose, SendIcon, BotMessageSquare, Trash } from 'lucide-react';

const ChatbotComponent = ({ onClose }) => {
  const { messages, input, handleInputChange, handleSubmit, reset } = useChat();
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  const DUMMY_SUGGESTIONS = [
    'What services do you offer?',
    'Can I see your projects?',
    'How can I hire you?',
    'Tell me about your experience.',
  ];

  useEffect(() => {
    setSuggestions(DUMMY_SUGGESTIONS);
  }, [DUMMY_SUGGESTIONS]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    if (messages[messages.length - 1]?.role === 'user') {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion) => {
    handleInputChange({ target: { value: suggestion } });
    handleSubmit({
      preventDefault: () => {},
      target: { elements: { input: { value: suggestion } } },
    });
    setSuggestions([]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-10 bg-gray-800 rounded-xl shadow-lg flex flex-col h-96 max-w-xs w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex justify-between items-center p-4 bg-gray-900 rounded-t-xl"><h2 className="text-lg font-semibold">Chatbot</h2>
        <button onClick={onClose} aria-label="Close Chatbot">
          <LucidePanelTopClose size={24} className="hover:text-red-500 transition" />
        </button>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 p-4 space-y-4 overflow-y-auto bg-gray-800">
        <p className="text-gray-400">
          Hi there! I’m a chatbot developed by <b>Aparna pradhan </b> here to assist you with anything about his portfolio.
        </p>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.role === 'assistant'
                ? 'bg-purple-700 text-white'
                : 'bg-blue-600 text-white ml-auto'
            }`}
          >
            <ReactMarkdown
              components={{
                a: ({ node, ...props }) => (
                  <Link
                    {...props}
                    href={props.href || ''}
                    className="text-blue-300 hover:underline"
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        {isTyping && (
          <div className="text-gray-400 italic animate-pulse">Typing...</div>
        )}
      </div>

      {/* Suggestions */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <h4 className="text-gray-300">Quick Suggestions:</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm hover:bg-gray-600 transition"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-900 border-t border-gray-700 flex items-center space-x-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          rows="1"
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          className="p-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-110 transition-transform"
          aria-label="Send Message"
        >
          <SendIcon size={20} />
        </button>
       
          
      </div>
    </div>
  );
};

const ChatbotToggleButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-500 to-blue-600 p-4 rounded-full shadow-lg text-white hover:scale-110 transition-transform"
    aria-label="Open Chatbot"
  >
    <BotMessageSquare size={24} />
  </button>
);

const ChatbotContainer = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <>
      {isChatbotOpen && (
        <ChatbotComponent onClose={() => setIsChatbotOpen(false)} />
      )}
      {!isChatbotOpen && (
        <ChatbotToggleButton onClick={() => setIsChatbotOpen(true)} />
      )}
    </>
  );
};

export default ChatbotContainer;
