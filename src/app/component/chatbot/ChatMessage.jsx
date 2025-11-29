'use client';
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Bot, User } from 'lucide-react';

const ChatMessage = memo(({ message, isStreaming = false, isMobile = false }) => {
  const cleanResponse = (text) => {
    if (!text) return '';
    
    return String(text)
      .replace(/\\n/g, '\n')
      .replace(/\\r\\n|\\r/g, '\n')
      .replace(/["""]/g, '"')
      .replace(/\s*"\s*/g, '"')
      .replace(/```(\w*)\s*([\s\S]*?)\s*```/g, '```$1\n$2\n```')
      .replace(/(\n\s*)(\*|\-|\d+\.)\s+/g, '$1$2 ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const MarkdownRenderer = memo(function MarkdownRenderer({ children }) {
    const cleanedContent = React.useMemo(() => cleanResponse(children), [children]);
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          p: ({ node, ...props }) => (
            <p className="mb-4 last:mb-0" {...normalizeProps(props)} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <pre className="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto">
                <code className={className} {...props}>
                  {String(children).replace(/\n$/, '')}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-700 rounded px-1.5 py-0.5 text-sm" {...props}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a 
              className="text-purple-600 dark:text-purple-400 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 my-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 my-2" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-purple-500 pl-4 italic my-4 text-gray-600 dark:text-gray-300"
              {...props}
            />
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    );
  });

  function normalizeProps(props) {
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
      return child
        .replace(/\n{3,}/g, '\n\n')
        .replace(/"{3,}/g, '"""');
    }
    return child;
  }

  const isUser = message.role === 'user';
  const isToolResult = message.isToolResult;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn group`}
    >
      <div
        className={`rounded-2xl transition-all duration-200 ${
          isMobile 
            ? 'max-w-[85%] p-3' 
            : 'max-w-[90%] sm:max-w-[80%] md:max-w-[75%] p-3 sm:p-4 hover:shadow-lg'
        } ${
          isUser
            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-none shadow-lg'
            : isToolResult
            ? 'bg-blue-900/30 border border-blue-700/50 rounded-bl-none text-blue-100 backdrop-blur-sm'
            : 'bg-gray-800/80 border border-gray-700/50 rounded-bl-none text-gray-100 backdrop-blur-sm'
        }`}
      >
        {/* Enhanced message header with icon */}
        <div className="flex items-center space-x-2 mb-2">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-purple-400/20' 
              : isToolResult 
              ? 'bg-blue-400/20' 
              : 'bg-gray-600/20'
          }`}>
            {isUser ? (
              <User className="w-3 h-3 text-purple-200" />
            ) : (
              <Bot className="w-3 h-3 text-blue-400" />
            )}
          </div>
          <span className={`text-xs font-medium ${
            isUser ? 'text-purple-200' : 'text-gray-400'
          }`}>
            {isUser ? 'You' : isToolResult ? 'System' : 'AI Assistant'}
          </span>
          {isStreaming && (
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          )}
        </div>
        
        {/* Enhanced message content */}
        <div className={`prose prose-sm max-w-none ${
          isMobile ? 'prose-xs' : 'prose-sm'
        }`}>
          <MarkdownRenderer>
            {message.content ? message.content.replace(/\[(CONFIDENCE|INTENT|TOPICS):[^\]]+\]/g, "").trim() : ''}
          </MarkdownRenderer>
        </div>
        
        {/* Enhanced message footer with timestamp and metadata */}
        <div className={`mt-3 text-xs flex items-center space-x-2 ${
          isUser ? 'justify-end' : 'justify-between'
        }`}>
          <div className="flex items-center space-x-2 opacity-60">
            {message.timestamp && (
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
            {message.confidence && !isUser && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                message.confidence > 0.8 
                  ? 'bg-green-500/20 text-green-400' 
                  : message.confidence > 0.6 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {Math.round(message.confidence * 100)}%
              </span>
            )}
          </div>
          
          {/* Message actions - only show on hover for desktop */}
          {!isMobile && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
              <button
                onClick={() => navigator.clipboard?.writeText(message.content)}
                className="p-1 hover:bg-gray-600/50 rounded text-gray-400 hover:text-gray-200 transition-colors"
                title="Copy message"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;