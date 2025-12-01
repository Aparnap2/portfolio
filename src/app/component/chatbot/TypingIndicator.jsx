'use client';
import React, { memo } from 'react';

const TypingIndicator = memo(() => {
  return (
    <div className="flex items-center space-x-1" role="status" aria-live="polite" aria-atomic="true">
      <span className="sr-only">AI assistant is typing</span>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="w-2 h-2 bg-gradient-to-r from-blue-300 to-purple-400 rounded-full animate-bounce"
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s',
            animationIterationCount: 'infinite'
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;