'use client'
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Send, Bot, X, Loader2, ChevronDown } from "lucide-react";
import QuantumBackground from './ModernGridBackground';
import Image from 'next/image';

const ChatbotComponent = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I&apos;m Aparna&apos;s AI assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Thinking...');
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const controller = useRef(null);
  const loadingTimeoutRef = useRef(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--scrollbar-thumb',
      'rgba(167, 139, 250, 0.5)'
    );

    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: var(--scrollbar-thumb);
        border-radius: 20px;
      }
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: var(--scrollbar-thumb) transparent;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // Custom markdown components with updated styling
  const markdownComponents = {
    // Headers
    h1: ({ node, ...props }) => (
      <h1 
        className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent" 
        {...normalizeProps(props)}
      />
    ),
    h2: ({ node, ...props }) => (
      <h2 
        className="text-xl font-semibold mb-3 bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent" 
        {...normalizeProps(props)}
      />
    ),
    h3: ({ node, ...props }) => (
      <h3 
        className="text-lg font-medium mb-2 text-accent1" 
        {...normalizeProps(props)}
      />
    ),
    
    // Text elements
    p: ({ node, ...props }) => {
      const children = Array.isArray(props.children) 
        ? props.children.map(processChild)
        : processChild(props.children);
      
      return (
        <p 
          className="mb-4 leading-relaxed text-gray-200/90 whitespace-pre-wrap" 
          {...normalizeProps(props)}
        >
          {children}
        </p>
      );
    },
    
    strong: ({ node, ...props }) => (
      <strong 
        className="font-semibold text-orange-300" 
        {...normalizeProps(props)}
      />
    ),
    
    a: ({ node, ...props }) => (
      <a
        className="text-purple-300 hover:text-orange-300 underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...normalizeProps(props)}
      />
    ),
    
    // Code blocks and inline code
    code: ({ node, inline, ...props }) => {
      if (inline) {
        return (
          <code 
            className="bg-gray-700 rounded px-1.5 py-0.5 text-sm font-mono text-orange-200"
            {...normalizeProps(props)}
          />
        );
      }
      return (
        <pre className="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto">
          <code 
            className="text-sm font-mono text-gray-100 block"
            {...normalizeProps(props)}
          />
        </pre>
      );
    },
    
    // Lists
    ul: ({ node, ...props }) => (
      <ul 
        className="mb-4 pl-6 list-disc text-gray-200/90" 
        {...normalizeProps(props)}
      />
    ),
    ol: ({ node, ...props }) => (
      <ol 
        className="mb-4 pl-6 list-decimal text-gray-200/90" 
        {...normalizeProps(props)}
      />
    ),
    li: ({ node, ...props }) => (
      <li 
        className="mb-2 leading-relaxed" 
        {...normalizeProps(props)}
      />
    ),
    
    // Blockquotes
    blockquote: ({ node, ...props }) => (
      <blockquote 
        className="border-l-4 border-purple-400 pl-4 italic text-gray-300 my-4" 
        {...normalizeProps(props)}
      />
    ),
    
    // Horizontal rule
    hr: ({ node, ...props }) => (
      <hr 
        className="my-6 border-gray-700" 
        {...normalizeProps(props)}
      />
    ),
    
    // Images
    img: ({ node, ...props }) => (
      <Image 
        src={props.src} 
        alt={props.alt} 
        width={32}
        height={32}
        className="my-4 rounded-lg max-w-full h-auto" 
        loading="lazy" 
        {...normalizeProps(props)}
      />
    ),
  };
  
  // Helper functions
  function normalizeProps(props) {
    // Handle cases where children might contain problematic strings
    if (props.children) {
      return {
        ...props,
        children: Array.isArray(props.children) 
          ? props.children.map(processChild)
          : processChild(props.children)
      };
    }
    return props;
  }
  
  function processChild(child) {
    if (typeof child === 'string') {
      // Handle multiple newlines and triple quotes
      return child
        .replace(/\n{3,}/g, '\n\n')  // Limit consecutive newlines to 2
        .replace(/"{3,}/g, '"""');    // Handle excessive quotes
    }
    return child;
  }
  const scrollToBottom = useCallback(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const resetLoadingStates = useCallback(() => {
    clearTimeout(loadingTimeoutRef.current);
    setIsLoading(false);
    setIsStreaming(false);
    setLoadingProgress(0);
    setLoadingMessage('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = {
      role: 'user',
      content: input.replace(/\n/g, '\\n'),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    }]);

    setIsLoading(true);
    setIsStreaming(true);

    let reader;
    try {
      controller.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          messages: [...messages, {
            ...userMsg,
            content: input // Send unescaped version to API
          }]
        }),
        signal: controller.current.signal,
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();

        for (const chunk of chunks) {
          if (!chunk.startsWith('data:')) continue;

          const data = chunk.replace(/^data:\s*/, '').trim();
          if (data === '[DONE]') break;

          try {
            let content = data;
            if (data.startsWith('{') || data.startsWith('[')) {
              const parsed = JSON.parse(data);
              content = parsed.content || parsed.choices?.[0]?.delta?.content || '';
            }

            if (content) {
              responseText += content.replace(/\n/g, '\\n');
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...newMessages[newMessages.length - 1],
                  content: responseText
                };
                return newMessages;
              });
            }
          } catch (e) {
            console.warn('Error parsing chunk:', e);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Streaming error:', err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ An error occurred while generating the response.',
          timestamp: new Date().toISOString()
        }]);
      }
    } finally {
      if (reader) await reader.cancel();
      setLoadingProgress(100);
      setLoadingMessage('Response complete');
      loadingTimeoutRef.current = setTimeout(resetLoadingStates, 500);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    let interval;
    if (isStreaming) {
      let progress = loadingProgress;
      const messages = [
        'Analyzing your query',
        'Searching knowledge base',
        'Generating response',
        'Finalizing answer'
      ];

      interval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 10, 95);
        setLoadingProgress(progress);
        setLoadingMessage(messages[Math.floor(progress / 25)]);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  useEffect(() => scrollToBottom(), [messages, scrollToBottom]);
  useEffect(() => {
    return () => {
      controller.current?.abort();
      clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div 
        className={`relative w-full max-w-4xl h-[80vh] max-h-[800px] bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-300 ${
          isExpanded ? 'h-[90vh]' : ''
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gradient-to-br from-orange-400 to-purple-500">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-orange-300 to-purple-300 bg-clip-text text-transparent">
              AI Assistant
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50"
              aria-label={isExpanded ? 'Minimize' : 'Expand'}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700/50"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatRef}
          className="h-[calc(100%-120px)] p-4 space-y-4 overflow-y-auto custom-scrollbar"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-none'
                    : 'bg-gray-800/70 border border-gray-700/50 rounded-bl-none text-gray-100'
                }`}
              >
                <ReactMarkdown
                  components={markdownComponents}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  className="prose prose-invert max-w-none"
                >
                  {message.content}
                </ReactMarkdown>
                <div className="mt-2 text-xs opacity-50 text-right">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-start space-x-2 p-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-purple-500 p-1.5">
                <Bot className="w-full h-full text-white" />
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className="w-2 h-2 bg-gradient-to-r from-orange-300 to-purple-400 rounded-full animate-bounce"
                    style={{ 
                      animationDelay: `${dot * 0.2}s`,
                      animationDuration: '1.4s',
                      animationIterationCount: 'infinite'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900/90 to-transparent">
          <form
            onSubmit={handleSubmit}
            className="flex items-end space-x-2"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-gray-800/70 border border-gray-700/50 text-white rounded-xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 resize-none"
                rows="1"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 bottom-2 p-1.5 rounded-lg ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:opacity-90'
                    : 'text-gray-500'
                } transition-all`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-400">
              AI assistant powered by Aparna&apos;s portfolio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotComponent;