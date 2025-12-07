'use client';
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkEmoji from 'remark-emoji';
import 'katex/dist/katex.min.css';
import { Bot, User, Copy, Check } from 'lucide-react';

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
        remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          p: ({ node, ...props }) => (
            <p className="mb-4 last:mb-0 leading-relaxed text-gray-100" {...normalizeProps(props)} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-4 rounded-xl overflow-hidden border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm">
                <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 px-4 py-2 text-xs font-medium text-slate-300 border-b border-slate-700/50">
                  {match[1]}
                </div>
                <pre className="p-4 overflow-x-auto">
                  <code className={`${className} text-slate-100 font-mono text-sm leading-relaxed`} {...props}>
                    {String(children).replace(/\n$/, '')}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 text-cyan-300 rounded-md px-2 py-1 text-sm font-mono border border-slate-600/50 shadow-sm" {...props}>
                {children}
              </code>
            );
          },
          a: ({ node, ...props }) => (
            <a
              className="text-blue-400 hover:text-blue-300 underline transition-colors duration-200 hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 my-3 space-y-2 text-gray-100" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 my-3 space-y-2 text-gray-100" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed text-gray-100" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-300 bg-gradient-to-r from-slate-800/50 to-transparent rounded-r-lg py-3 backdrop-blur-sm"
              {...props}
            />
          ),
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 text-slate-100 border-b-2 border-blue-500/30 pb-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 text-slate-200 border-b border-slate-700 pb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mt-5 mb-2 text-slate-300" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-semibold mt-4 mb-2 text-slate-300" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="text-base font-semibold mt-3 mb-1 text-slate-400" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="text-sm font-medium mt-3 mb-1 text-slate-400" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="my-6 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm overflow-hidden shadow-lg">
              <table className="min-w-full divide-y divide-slate-700/50" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gradient-to-r from-slate-800/80 to-slate-700/80" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-slate-700/30" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-800/40 transition-colors duration-200" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider text-slate-200 border-b-2 border-blue-500/30" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-sm text-slate-300" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-slate-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-slate-300" {...props} />
          ),
          del: ({ node, ...props }) => (
            <del className="text-slate-500 line-through" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img className="rounded-lg shadow-lg my-4 max-w-full h-auto" {...props} />
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
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  return (
    <article
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn group`}
      role="article"
      aria-label={`Message from ${isUser ? 'you' : isToolResult ? 'system' : 'AI assistant'}`}
      style={{
        visibility: 'visible',
        opacity: 1,
        display: 'flex',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div
        className={`rounded-2xl transition-all duration-200 ${isMobile
            ? 'max-w-[85%] p-3'
            : 'max-w-[90%] sm:max-w-[80%] md:max-w-[75%] p-3 sm:p-4 hover:shadow-lg'
          } ${isUser
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
            : isToolResult
              ? 'bg-blue-900/40 border border-blue-600/60 rounded-bl-none text-blue-100 backdrop-blur-sm'
              : 'bg-gray-800/90 border border-gray-700/50 text-gray-100 backdrop-blur-sm'
          }`}
        style={{
          visibility: 'visible',
          opacity: 1,
          display: 'block',
          position: 'relative',
          zIndex: 1,
          color: isUser ? 'white' : '#f8fafc'
        }}
      >
        {/* Enhanced message header with icon - improved contrast */}
        <header className="flex items-center space-x-2 mb-2">
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isUser
              ? 'bg-white/20'
              : isToolResult
                ? 'bg-blue-400/30'
                : 'bg-gray-600/30'
            }`} aria-hidden="true">
            {isUser ? (
              <User className="w-3 h-3 text-white" />
            ) : (
              <Bot className="w-3 h-3 text-blue-300" />
            )}
          </div>
          <span className={`text-xs font-medium ${isUser ? 'text-white' : 'text-gray-200'
            }`}>
            {isUser ? 'You' : isToolResult ? 'System' : 'AI Assistant'}
          </span>
          {isStreaming && (
            <div className="flex items-center space-x-1" role="status" aria-live="polite">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-xs text-green-400">Live</span>
            </div>
          )}
        </header>

        {/* Enhanced message content with better typography */}
        <div
          className={`prose prose-sm max-w-none ${isMobile ? 'prose-xs' : 'prose-sm'
            } ${isUser
              ? 'prose-invert prose-p:text-white prose-li:text-white prose-headings:text-white prose-strong:text-white prose-em:text-gray-100 prose-code:text-cyan-200 prose-pre:bg-gray-900/90 prose-pre:border-gray-600/50'
              : 'prose-invert prose-p:text-gray-100 prose-li:text-gray-100 prose-headings:text-gray-100 prose-strong:text-gray-100 prose-em:text-gray-200 prose-code:text-cyan-300 prose-pre:bg-gray-800/90 prose-pre:border-gray-700/50'
            }`}
          style={{
            visibility: 'visible',
            opacity: 1,
            display: 'block',
            position: 'relative',
            zIndex: 1,
            color: 'inherit'
          }}
        >
          <MarkdownRenderer>
            {message.content ? message.content.replace(/\[(CONFIDENCE|INTENT|TOPICS):[^\]]+\]/g, "").trim() : ''}
          </MarkdownRenderer>
        </div>

        {/* Enhanced message footer with timestamp and metadata - improved contrast */}
        <footer className={`mt-3 text-xs flex items-center space-x-2 ${isUser ? 'justify-end' : 'justify-between'
          }`}>
          <div className="flex items-center space-x-2 opacity-70">
            {message.timestamp && (
              <time dateTime={message.timestamp} className={isUser ? 'text-white/70' : 'text-gray-300'}>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            )}
            {message.confidence && !isUser && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${message.confidence > 0.8
                  ? 'bg-green-400/30 text-green-200'
                  : message.confidence > 0.6
                    ? 'bg-yellow-400/30 text-yellow-200'
                    : 'bg-red-400/30 text-red-200'
                }`} aria-label={`Confidence: ${Math.round(message.confidence * 100)}%`}>
                {Math.round(message.confidence * 100)}%
              </span>
            )}
          </div>

          {/* Message actions - only show on hover for desktop */}
          {!isMobile && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
              <button
                onClick={handleCopy}
                className={`p-1.5 hover:bg-gray-600/50 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400/70 ${isUser ? 'text-white/70 hover:text-white' : 'text-gray-300 hover:text-gray-100'}`}
                title={copied ? "Copied!" : "Copy message"}
                aria-label={copied ? "Message copied" : "Copy message to clipboard"}
              >
                {copied ? (
                  <Check className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Copy className="w-3 h-3" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </footer>
      </div>
    </article>
  );
});

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;