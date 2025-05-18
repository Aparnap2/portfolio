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

const ChatbotComponent = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const controller = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Custom markdown components with proper newline handling
  const markdownComponents = {
    // Headings
    h1: ({ node, ...props }) => (
      <h1 className="text-3xl font-bold mb-6 text-accent1 border-b-2 border-accent1 pb-2" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-2xl font-semibold mb-4 text-accent2 border-b border-accent2 pb-1.5" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-xl font-medium mb-3 text-accent1" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="text-lg font-medium mb-2 text-accent2" {...props} />
    ),
    h5: ({ node, ...props }) => (
      <h5 className="text-base font-medium mb-2 text-accent1" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="text-sm font-medium mb-1 text-accent2" {...props} />
    ),
    
    // Text
    p: ({ node, ...props }) => {
      // Handle string children
      if (typeof props.children === 'string') {
        if (props.children.trim() === '') {
          return <br className="my-2" />;
        }
        return <p className="mb-4 leading-relaxed text-text/90 whitespace-pre-wrap" {...props} />;
      }
      
      // Handle array children
      if (Array.isArray(props.children) && props.children.every(child => {
        if (typeof child === 'string') return child.trim() === '';
        if (React.isValidElement(child)) return false;
        return true;
      })) {
        return <br className="my-2" />;
      }
      
      // Default case
      return <p className="mb-4 leading-relaxed text-text/90 whitespace-pre-wrap" {...props} />;
    },
    strong: ({ node, ...props }) => (
      <strong className="font-semibold text-accent1" {...props} />
    ),
    em: ({ node, ...props }) => (
      <em className="italic" {...props} />
    ),
    del: ({ node, ...props }) => (
      <del className="line-through text-text/60" {...props} />
    ),
    
    // Lists
    ul: ({ node, depth = 0, ...props }) => (
      <ul 
        className={`list-disc pl-6 mb-4 space-y-2 marker:text-accent1 ${
          depth > 0 ? 'pl-4' : ''
        }`} 
        {...props} 
      />
    ),
    ol: ({ node, depth = 0, ...props }) => (
      <ol 
        className={`list-decimal pl-6 mb-4 space-y-2 marker:text-accent2 ${
          depth > 0 ? 'pl-4' : ''
        }`} 
        {...props} 
      />
    ),
    li: ({ node, ordered, ...props }) => (
      <li className="mb-1 text-text/80 whitespace-pre-wrap" {...props} />
    ),
    
    // Blockquotes
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-accent2 pl-4 my-4 text-text/80 italic bg-background/20 py-2 rounded-r" {...props} />
    ),
    
    // Code
    code: ({ node, inline, className, ...props }) => {
      if (inline) {
        return (
          <code 
            className="px-2 py-1 bg-background/30 rounded-lg border border-accent1/20 text-accent1 font-mono text-sm whitespace-pre-wrap" 
            {...props} 
          />
        );
      }
      return (
        <pre className="p-4 my-4 bg-background/30 rounded-lg border border-accent1/20 overflow-x-auto">
          <code className={`font-mono text-sm whitespace-pre ${className}`} {...props} />
        </pre>
      );
    },
    
    // Links
    a: ({ node, ...props }) => (
      <a
        className="text-accent2 hover:text-accent1 underline transition-colors decoration-accent2/50 hover:decoration-accent1"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    
    // Tables
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse whitespace-nowrap" {...props} />
      </div>
    ),
    thead: ({ node, ...props }) => (
      <thead className="bg-background/20" {...props} />
    ),
    tbody: ({ node, ...props }) => <tbody {...props} />,
    tr: ({ node, ...props }) => (
      <tr className="border-b border-accent1/20" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="px-4 py-2 text-left font-semibold text-accent1" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="px-4 py-2 text-text/80" {...props} />
    ),
    
    // Images
    img: ({ node, ...props }) => (
      <div className="my-4">
        <img 
          className="max-w-full h-auto rounded-lg border border-accent1/20" 
          loading="lazy"
          {...props} 
        />
      </div>
    ),
    
    // Horizontal rule
    hr: ({ node, ...props }) => (
      <hr className="my-6 border-accent1/20" {...props} />
    ),
    
    // Task lists
    input: ({ node, checked, ...props }) => (
      <input 
        type="checkbox" 
        checked={checked} 
        readOnly 
        className="mr-2 align-middle rounded border-accent1/50 text-accent1 focus:ring-accent1" 
        {...props} 
      />
    ),
    
    // Text node with newline handling
    text: ({ node, ...props }) => {
      const processedText = props.children
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
      
      return processedText.split('\n').map((line, i, arr) => (
        <React.Fragment key={i}>
          {line}
          {i !== arr.length - 1 && <br />}
        </React.Fragment>
      ));
    },
  };

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
      timestamp: new Date().toLocaleString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: '', 
      timestamp: new Date().toLocaleString() 
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
          timestamp: new Date().toLocaleString() 
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
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <QuantumBackground active />
      <div 
        className={`pointer-events-auto flex flex-col w-full max-w-lg bg-gradient-to-br from-background to-background/90 backdrop-blur-lg rounded-2xl border border-accent1/20 shadow-xl transition-all duration-300 ${
          isExpanded ? 'h-[calc(100vh-2rem)]' : 'h-[70vh] max-h-[600px] min-h-[400px]'
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-accent1 to-accent2 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">AI Assistant</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-1 text-white hover:bg-white/10 rounded"
            >
              <ChevronDown className={`${isExpanded ? 'rotate-180' : ''} w-5 h-5`} />
            </button>
            <button 
              onClick={onClose} 
              className="p-1 text-white hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          ref={chatRef} 
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-accent1/30 scrollbar-track-transparent"
        >
          {messages.length === 0 && (
            <div className="p-4 bg-background/30 rounded-lg border border-accent1/20">
              <h4 className="text-sm font-semibold text-accent2 mb-2">Try asking:</h4>
              <ul className="space-y-2">
                {[
                  'Explain RAG architecture',
                  'How to integrate AI in React Native?',
                  'Show me an example of a full-stack project'
                ].map((question, i) => (
                  <li 
                    key={i} 
                    onClick={() => setInput(question)}
                    className="cursor-pointer text-text hover:text-accent1 transition-colors"
                  >
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((message, i) => (
            <div 
              key={i} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-4 rounded-xl ${
                  message.role === 'user' 
                    ? 'bg-accent1/10 rounded-br-none border border-accent1/20' 
                    : 'bg-background/30 rounded-bl-none border border-accent2/20'
                }`}
              >                
                <ReactMarkdown
                  components={markdownComponents}
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  className="prose-invert prose-sm max-w-none whitespace-pre-wrap"
                >
                  {message.content.replace(/\\n/g, '\n')}
                </ReactMarkdown>
                <div className="mt-1 text-xs text-text/50">
                  {message.timestamp}
                </div>
              </div>
            </div>
          ))}

          {(isStreaming || loadingProgress > 0) && (
            <div className="w-full p-3 bg-background/30 rounded-lg border border-accent1/20">
              <div className="w-full h-1.5 bg-accent1/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-accent1 to-accent2 transition-all duration-300 ease-out" 
                  style={{ width: `${loadingProgress}%` }} 
                />
              </div>
              <div className="flex items-center mt-2 text-sm text-accent2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="ml-2 truncate">{loadingMessage}...</span>
                <span className="ml-auto text-xs">
                  {Math.floor(loadingProgress)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <form 
          onSubmit={handleSubmit} 
          className="px-4 py-3 bg-background/50 border-t border-accent1/20 rounded-b-2xl"
        >
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 p-3 bg-black rounded-lg resize-none overflow-y-auto max-h-32 placeholder-text/50 focus:outline-none focus:ring-2 focus:ring-accent1 text-sm border border-accent1/20"
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
              className={`p-3 rounded-lg transition-colors ${
                isLoading 
                  ? 'bg-accent1/30 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-accent1 to-accent2 hover:opacity-90'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotComponent;