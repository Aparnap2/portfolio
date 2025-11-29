'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const FullScreenReadmeModal = ({ isOpen, onClose, title, content, projectUrl }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            className="fixed inset-0 flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-4 sm:p-6">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate pr-4">
                    {title} - README
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    Full project documentation
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {/* External Links */}
                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
                    title="View on GitHub"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  
                  <a
                    href={projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
                    title="Open Repository"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  
                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    title="Close (ESC)"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                  {content ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="prose prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                        components={{
                          p: ({ node, ...props }) => (
                            <p className="mb-4 leading-relaxed" {...props} />
                          ),
                          code: ({ node, inline, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <pre className="bg-gray-800 rounded-lg p-4 my-4 overflow-x-auto border border-gray-700">
                                <code className={className} {...props}>
                                  {String(children).replace(/\n$/, '')}
                                </code>
                              </pre>
                            ) : (
                              <code className="bg-gray-700/50 text-blue-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                                {children}
                              </code>
                            );
                          },
                          a: ({ node, ...props }) => (
                            <a 
                              className="text-blue-400 hover:text-blue-300 underline transition-colors" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-6 my-4 space-y-1" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal pl-6 my-4 space-y-1" {...props} />
                          ),
                          blockquote: ({ node, ...props }) => (
                            <blockquote 
                              className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-300 bg-gray-800/30 py-2 rounded-r"
                              {...props}
                            />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 pb-2 border-b border-gray-700" {...props} />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 mt-8" {...props} />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 mt-6" {...props} />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-4">
                              <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden" {...props} />
                            </div>
                          ),
                          th: ({ node, ...props }) => (
                            <th className="bg-gray-800 px-4 py-2 text-left text-white font-semibold border-b border-gray-700" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="px-4 py-2 border-b border-gray-700 text-gray-300" {...props} />
                          ),
                        }}
                      >
                        {cleanResponse(content)}
                      </ReactMarkdown>
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading README...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Footer */}
            <div className="flex-shrink-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 p-4 sm:hidden">
              <div className="flex space-x-3">
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Github className="w-4 h-4" />
                  <span>View on GitHub</span>
                </a>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FullScreenReadmeModal;