'use client';
import React, { memo } from 'react';

const TypingIndicator = memo(() => {
  return (
    <div className="flex items-center space-x-1" aria-label="AI is typing">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce"
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s',
            animationIterationCount: 'infinite'
          }}
        />
      ))}
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;