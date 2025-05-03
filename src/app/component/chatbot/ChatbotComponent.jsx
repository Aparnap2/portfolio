'use client';
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Bot, X, Loader2, ChevronDown } from "lucide-react";
import QuantumBackground from './ModernGridBackground';

const ChatbotComponent = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions] = useState([
    "Can you share a quick tip for fine-tuning large language models?",
    "What's a unique project where you used RAG for AI integration?",
    "How do you integrate LLM APIs into React Native apps efficiently?",
    "What's your go-to method for ensuring AI model performance in apps?",
    "Can you briefly describe a full-stack AI project you've worked on?",
  ]);
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const controller = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessages = [...messages, { role: 'user', content: input, timestamp: new Date().toLocaleString() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      controller.current = new AbortController();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages: newMessages }),
        signal: controller.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let responseText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Handle empty chunks
        if (value?.length === 0) continue;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          responseText += chunk;
          setMessages(prev => [
            ...prev.slice(0, -1),
            { role: 'assistant', content: responseText, timestamp: new Date().toLocaleString() }
          ]);
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      if (error.name !== 'AbortError') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Error: ' + (error.message || 'Failed to process request. Please try again.'),
          timestamp: new Date().toLocaleString()
        }]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      if (controller.current) {
        controller.current = null;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-end p-4 pointer-events-none">
      <QuantumBackground active={true} />

      <div
        className="relative flex flex-col w-full max-w-2xl bg-gradient-to-br from-background/95 via-background/90 to-background/80 backdrop-blur-2xl rounded-3xl border border-accent1/30 shadow-2xl pointer-events-auto transition-all duration-300 font-mono"
        style={{
          height: isExpanded ? 'calc(100vh - 2rem)' : 'clamp(300px, 70vh, 600px)',
          boxShadow: '0 8px 32px rgba(18, 18, 23, 0.5)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-accent1/20 bg-gradient-to-r from-accent1/5 to-accent2/5 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-accent1 to-accent2 rounded-lg shadow-lg">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-bold text-2xl bg-gradient-to-r from-accent1 to-accent2 bg-clip-text text-transparent">
              AI Assistant
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden p-2 hover:text-accent1 transition-colors hover:bg-accent1/10 rounded-lg"
            >
              <ChevronDown className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:text-accent2 transition-colors hover:bg-accent2/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-accent1/30 scrollbar-track-background/50"
        >
          {messages.length === 0 && (
            <div className="p-4 bg-accent1/5 rounded-2xl border border-accent1/20">
              <h4 className="text-sm font-medium text-accent2 mb-3">Suggested questions:</h4>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-3 bg-background/20 text-accent1 rounded-lg text-sm hover:bg-accent1/10 transition-all duration-200 border border-accent1/20 hover:border-accent2/30 group"
                  >
                    <span className="group-hover:translate-x-2 transition-transform duration-200">
                      {suggestion}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl transition-all duration-200 ${msg.role === 'user'
                ? 'bg-accent1/10 border border-accent1/20 hover:border-accent1/30'
                : 'bg-secondary/10 border border-accent2/20 hover:border-accent2/30'
                }`}>
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-3xl font-bold mb-6 text-accent1 border-b-2 border-accent1 pb-2" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-2xl font-semibold mb-4 text-accent2 border-b border-accent2 pb-1.5" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-xl font-medium mb-3 text-accent1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-4 leading-relaxed text-text/90" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc pl-6 mb-4 space-y-2 marker:text-accent1" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal pl-6 mb-4 space-y-2 marker:text-accent2" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="mb-1 text-text/80" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-accent2 pl-4 my-4 text-text/80 italic bg-background/20 py-2 rounded-r" {...props} />
                    ),
                    code: ({ inline, className, ...props }) => (
                      <code
                        className={`${inline ? 'px-2 py-1' : 'p-4 my-2'} bg-background/30 rounded-lg border border-accent1/20 text-accent1 font-mono text-sm block overflow-x-auto`}
                        {...props}
                      />
                    ),
                    a: (props) => (
                      <a
                        className="text-accent2 hover:text-accent1 underline transition-colors decoration-accent2/50 hover:decoration-accent1"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    ),
                  }}
                  className="prose-invert prose-sm max-w-none"
                >
                  {msg.content}
                </ReactMarkdown>
                <div className="text-xs text-accent1/70 mt-2">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isStreaming && (
            <div className="flex items-center space-x-2 p-2">
              <div className="flex space-x-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-gradient-to-r from-accent1 to-accent2 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-sm text-accent1">Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-accent1/20 bg-gradient-to-t from-background/50 to-transparent rounded-b-3xl"
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 p-3 font-bold bg-background/20 border border-accent1/30 rounded-lg resize-none placeholder:text-text/50 focus:outline-none focus:ring-2 focus:ring-accent2/50 focus:border-transparent transition-all duration-200 shadow-inner text-black"
              onInput={(e) => {
                const target = e.target;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-accent1 to-accent2 text-primary rounded-lg hover:bg-accent2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-accent2/20"
            >
              {isStreaming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 transition-transform hover:translate-x-0.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotComponent;