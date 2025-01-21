'use client';
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  SendIcon,
  BotMessageSquare,
  Trash,
  ShieldCloseIcon,
  Loader,
  ChevronDown,
} from "lucide-react";

const DUMMY_SUGGESTIONS = [
  "What services do you offer?",
  "Can I see your projects?",
  "How can I hire you?",
  "Tell me about your experience.",
];

const ChatbotComponent = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const controllerRef = useRef(null);

  // Scroll handling
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Textarea auto-resize
  const resizeTextarea = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // Event handlers
  const handleSuggestionClick = useCallback((suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  }, []);

  const handleClose = useCallback((e) => {
    e.stopPropagation();
    controllerRef.current?.abort();
    onClose();
  }, [onClose]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setIsStreaming(true);

    try {
      controllerRef.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
        signal: controllerRef.current.signal,
      });

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          botResponse += decoder.decode(value, { stream: true });
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: "assistant", content: botResponse }
          ]);
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, 
          { role: "assistant", content: "Oops, something went wrong! Please try again." }
        ]);
      }
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  // Markdown components with enhanced styling
  const markdownComponents = {
    a: ({ node, ...props }) => (
      <Link
        {...props}
        className="text-[#7d12ff] hover:text-[#00f7ff] underline transition-colors"
      />
    ),
    code: ({ node, inline, className, children, ...props }) => (
      <code
        className={`${inline ? 
          "bg-[#1a1a2f] text-[#00f7ff] px-2 py-1 rounded border border-[#00f7ff]/30" : 
          "bg-[#1a1a2f] text-[#00f7ff] block p-3 rounded-lg my-2 border border-[#00f7ff]/30"
        } font-mono text-sm`}
        {...props}
      >
        {children}
      </code>
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-[#00f7ff] bg-[#0a0a0f] pl-4 py-2 my-3 italic" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside space-y-2 my-2 pl-4 marker:text-[#7d12ff]" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal list-inside space-y-2 my-2 pl-4 marker:text-[#7d12ff]" {...props} />
    ),
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold my-3 text-[#00f7ff]" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-semibold my-2 text-[#7d12ff]" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="my-2 leading-relaxed text-[#e0e0f0]" {...props} />
    )
  };


  return (
    <div 
      className="fixed bottom-4 right-4 z-50 rounded-2xl shadow-2xl flex flex-col backdrop-blur-xl border border-[#00f7ff]/20 transition-all duration-300"
      style={{ 
        height: isMobileExpanded ? "calc(100vh - 60px)" : "clamp(300px, 70vh, 800px)",
        width: "clamp(300px, 95vw, 500px)",
        background: 'radial-gradient(circle at 20% 20%, #00f7ff15, #0a0a0f 85%)'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#0a0a0f] to-[#1a1a2f] rounded-t-2xl border-b border-[#00f7ff]/20">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-[#00f7ff] to-[#7d12ff] rounded-lg shadow-lg animate-pulse-slow">
            <BotMessageSquare className="w-5 h-5 text-[#0a0a0f]" />
          </div>
          <h2 className="text-lg font-semibold bg-gradient-to-r from-[#00f7ff] to-[#7d12ff] text-transparent bg-clip-text">
            Neural Assistant
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="md:hidden p-2 text-[#e0e0f0]/60 hover:text-[#00f7ff] transition-all"
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 text-[#e0e0f0]/60 hover:text-[#00f7ff] transition-all"
          >
            <Trash className="w-5 h-5" />
          </button>
          <button
            onClick={handleClose}
            className="p-2 text-[#e0e0f0]/60 hover:text-[#7d12ff] transition-all"
          >
            <ShieldCloseIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#00f7ff]/20 scrollbar-track-transparent"
      >
        {/* Introduction */}
        <div className="bg-[#1a1a2f] p-4 rounded-xl border border-[#00f7ff]/20 animate-fade-in">
          <p className="text-[#e0e0f0]/80 text-sm md:text-base">
            Hi there! I am an AI assistant specializing in {' '}
            <span className="font-semibold bg-gradient-to-r from-[#00f7ff] to-[#7d12ff] text-transparent bg-clip-text">
              AI integration
            </span>{' '}
            and neural system architecture.
          </p>
        </div>

        {/* Messages */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-message-in`}
          >
            <div className={`max-w-[90%] p-4 rounded-2xl shadow-lg ${
              message.role === "user" ?
              "bg-gradient-to-r from-[#00f7ff] to-[#00f7ff]/70 text-[#0a0a0f]" :
              "bg-gradient-to-r from-[#1a1a2f] to-[#1a1a2f]/90 border border-[#00f7ff]/20"
            }`}>
              <ReactMarkdown
                components={markdownComponents}
                className="prose-invert text-sm md:text-base break-words"
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-center space-x-2 p-2 animate-pulse">
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-[#00f7ff] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <span className="text-sm text-[#7d12ff] font-mono">
              Processing neural pathways...
            </span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#00f7ff]/20 space-y-3">
        <div className="flex items-center gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Query the neural network..."
            rows="1"
            className="flex-1 p-3 bg-[#1a1a2f] text-[#e0e0f0] rounded-xl border border-[#00f7ff]/30 placeholder-[#e0e0f0]/50 focus:border-[#7d12ff] focus:ring-2 focus:ring-[#7d12ff]/30 resize-none transition-all text-sm md:text-base"
            style={{ minHeight: '44px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-3 bg-gradient-to-r from-[#00f7ff] to-[#7d12ff] rounded-xl text-[#0a0a0f] shadow-lg hover:shadow-[#00f7ff]/30 disabled:opacity-50 transition-all relative overflow-hidden"
          >
            {isStreaming ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <SendIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-[#e0e0f0]/50 text-center">
          Neural responses may contain experimental predictions - verify critical data
        </p>
      </form>
    </div>
  );
};

const ChatbotToggleButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-[#00f7ff] to-[#7d12ff] rounded-full shadow-2xl hover:shadow-[#00f7ff]/40 text-[#0a0a0f] transform hover:scale-110 transition-all group animate-float"
    aria-label="Activate Neural Interface"
  >
    <BotMessageSquare className="w-6 h-6" />
    <div className="absolute inset-0 rounded-full border-2 border-[#00f7ff]/30 group-hover:border-[#7d12ff]/50 transition-all" />
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