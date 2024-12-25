import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  SendIcon,
  BotMessageSquare,
  Trash,
  ShieldCloseIcon,
  Loader,
} from "lucide-react";

const ChatbotComponent = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const [chatHeight, setChatHeight] = useState('600px');
  const DUMMY_SUGGESTIONS = [
    "What services do you offer?",
    "Can I see your projects?",
    "How can I hire you?",
    "Tell me about your experience.",
  ];

  useEffect(() => {
    setSuggestions(DUMMY_SUGGESTIONS);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === "" || isStreaming) return;

    const userMessage = { role: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsTyping(true);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let botResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          botResponse += chunk;
          setMessages((prevMessages) => [
            ...prevMessages.slice(0, -1),
            { role: "assistant", content: botResponse },
          ]);
        }

        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          { role: "assistant", content: botResponse.trim() },
        ]);
      }
    } catch (error) {
      console.error("Error fetching streamed response:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: "Oops, something went wrong!" },
      ]);
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    inputRef.current?.focus();
  };

  
 
  return (
    <div
    className="fixed bottom-4 right-4 z-10 bg-gray-800 rounded-xl shadow-lg flex flex-col max-h-full max-w-xs w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl"
    style={{ height: "calc(100vh - 64px)" }}
  >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-t-2xl border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <BotMessageSquare className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">AI Assistant</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleClearChat()}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
          >
            <Trash className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
          >
            <ShieldCloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat container */}
      <div 
        ref={chatContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        style={{ maxHeight: `calc(${chatHeight} - 130px)` }} // Adjust for header and input area
      >
        <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg shadow-md">
          <p className="text-gray-300">
            Hi there! Im a chatbot developed by <span className="font-semibold text-purple-400">Aparna Pradhan</span> to assist you with anything about their portfolio.
          </p>
        </div>

        {/* Messages */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                  : "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
              }`}
            >
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <Link
                      {...props}
                      href={props.href || ""}
                      className="text-blue-300 hover:text-blue-200 underline"
                    />
                  ),
                  code: ({ node, inline, className, children, ...props }) => (
                    <code
                      className={`${
                        inline
                          ? "bg-gray-800 bg-opacity-50 text-yellow-300 px-1 py-0.5 rounded"
                          : "bg-gray-800 bg-opacity-50 text-yellow-300 block p-3 rounded-lg my-2"
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc list-inside space-y-1 my-2" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2" {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center space-x-2 p-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-sm text-purple-400">Thinking...</span>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Suggested questions:</h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300 rounded-full text-sm hover:from-purple-600 hover:to-blue-600 hover:text-white transition-all duration-300 shadow-md"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 bg-gray-900 rounded-b-2xl border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            rows="1"
            className="flex-1 p-3 bg-gray-800 text-gray-200 rounded-xl border border-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200"
          >
            {isStreaming ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <SendIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const ChatbotToggleButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-4 right-4 z-50 p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg hover:shadow-purple-500/20 text-white transform hover:scale-110 transition-all duration-300 animate-bounce"
    aria-label="Open Chatbot"
  >
    <BotMessageSquare className="w-6 h-6" />
  </button>
);

const ChatbotContainer = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <>
      {isChatbotOpen ? (
        <ChatbotComponent onClose={() => setIsChatbotOpen(false)} />
      ) : (
        <ChatbotToggleButton onClick={() => setIsChatbotOpen(true)} />
      )}
    </>
  );
};

export default ChatbotContainer;