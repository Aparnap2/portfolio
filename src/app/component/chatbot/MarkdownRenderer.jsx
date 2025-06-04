import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const MarkdownRenderer = ({ content }) => {
  const processedContent = useMemo(() => {
    if (!content) return '';
    return String(content)
      .replace(/[“”"""]/g, '"')
      .replace(/\s*"\s*/g, '"')
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r\\n|\\r/g, '\n')
      .trim();
  }, [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        p: ({ node, ...props }) => (
          <p className="mb-3 last:mb-0 leading-relaxed" {...props} />
        ),
        h1: ({ node, ...props }) => (
          <h1 className="text-2xl font-bold text-white mt-6 mb-3" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="text-xl font-bold text-white mt-5 mb-2" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-6 my-2 space-y-1" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="mb-1" {...props} />
        ),
        a: ({ node, ...props }) => (
          <a 
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2" 
            target="_blank" 
            rel="noopener noreferrer"
            {...props}
          />
        ),
        code: ({ node, inline, className, children, ...props }) => {
          if (inline) {
            return (
              <code 
                className="bg-gray-700 text-orange-300 px-1.5 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          }
          
          const match = /language-(\w+)/.exec(className || '');
          return (
            <div className="bg-gray-800 rounded-lg my-4 overflow-hidden">
              <pre className="p-4 overflow-x-auto">
                <code className={className} {...props}>
                  {String(children).replace(/\n$/, '')}
                </code>
              </pre>
            </div>
          );
        },
        blockquote: ({ node, ...props }) => (
          <blockquote 
            className="border-l-4 border-purple-500 pl-4 italic my-4 text-gray-300"
            {...props} 
          />
        ),
        table: ({ node, ...props }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-gray-700" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => (
          <thead className="bg-gray-800" {...props} />
        ),
        tbody: ({ node, ...props }) => (
          <tbody className="divide-y divide-gray-700" {...props} />
        ),
        tr: ({ node, ...props }) => (
          <tr className="hover:bg-gray-800/50" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="px-4 py-2 text-left border-b border-gray-700" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="px-4 py-2 border-b border-gray-800" {...props} />
        ),
      }}
    >
      {processedContent}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
