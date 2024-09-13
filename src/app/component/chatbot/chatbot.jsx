import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { LucidePanelTopClose, SendIcon, BotMessageSquare } from 'lucide-react';

const ChatbotComponent = ({ onClose }) => {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [suggestions, setSuggestions] = useState([]);
  const chatContainerRef = useRef(null);

  // Dummy suggestions for testing
  const DUMMY_SUGGESTIONS = [
    'Tell me about yourself',
    'What are your skills?',
    'Show me your portfolio',
    'How can I contact you?',
  ];

  // Load suggestions on startup
  useEffect(() => {
    setSuggestions(DUMMY_SUGGESTIONS);
  }, []);

  // Scroll to the latest message automatically
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handles the click on a suggestion, sets input, submits, and hides suggestions
  const handleSuggestionClick = (suggestion) => {
    handleInputChange({ target: { value: suggestion } }); // Update input
    handleSubmit({
      preventDefault: () => {},
      target: { elements: { input: { value: suggestion } } },
    }); // Submit form
    setSuggestions([]); // Hide suggestions
  };

  return (
    <div className="fixed bottom-4 right-4 z-10 bg-gray-800 rounded-xl shadow-lg flex flex-col h-96 max-w-xs w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex justify-between items-center p-4 bg-gray-900 rounded-t-xl">
        <h2 className="text-lg font-bold text-white">Chatbot</h2>
        <button onClick={onClose}>
          <LucidePanelTopClose size={24} className="text-white hover:text-red-400 transition-colors" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
        <h3 className="text-gray-400 font-serif">
          Welcome! <br />
          I&apos;m a chatbot aware of my master <span className='text-red-50'>Aparna Pradhan</span> <br />
          You can ask me anything about his portfolio
        </h3>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index}>
              <div className="bg-gray-700 text-white p-3 rounded-lg">
                <ReactMarkdown
                  components={{
                    a: ({ node, ref, ...props }) => (
                      <Link
                        {...props}
                        href={props.href ?? ""}
                        className="text-primary hover:underline"
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p {...props} className="mt-3 first:mt-0" />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        {...props}
                        className="mt-3 list-inside list-disc first:mt-0"
                      />
                    ),
                    li: ({ node, ...props }) => <li {...props} className="mt-1" />,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
        {suggestions.length > 0 && (
          <div className="bg-gray-700 p-3 rounded-lg">
            <h4 className="text-white">Suggestions:</h4>
            <ul className="mt-2 space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-blue-300 cursor-pointer hover:text-blue-400" onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="p-4 bg-gray-900 rounded-b-xl flex items-center space-x-2">
        <textarea
          value={input}
          onChange={handleInputChange}
          rows="1"
          className="flex-1 p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
          placeholder="Type a message..."
          style={{ maxHeight: '150px' }}
        />
        <button className="bg-gradient-to-r from-orange-600 to-transparent hover:from-purple-500 hover:to-blue-500 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105" onClick={handleSubmit}>
          <SendIcon size={24} />
        </button>
      </div>
    </div>
  );
};

// Floating Button Component
const ChatbotToggleButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 right-4 z-20 bg-blue-500 p-3 rounded-full shadow-lg text-white hover:bg-blue-600 transition-colors animate-bounce"
  >
    <BotMessageSquare size={24} />
  </button>
);

const ChatbotContainer = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const toggleChatbot = () => {
    setIsChatbotOpen(prevState => !prevState);
  };

  return (
    <>
      {isChatbotOpen && <ChatbotComponent onClose={toggleChatbot} />}
      {!isChatbotOpen && <ChatbotToggleButton onClick={toggleChatbot} />}
    </>
  );
};

export default ChatbotContainer;
