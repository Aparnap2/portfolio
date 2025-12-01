import React from 'react';

const SkeletonLoader = ({ 
  type = 'message', 
  isMobile = false,
  className = '' 
}) => {
  const baseClass = "animate-pulse bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded";
  
  if (type === 'message') {
    return (
      <div className={`flex items-start space-x-3 p-4 ${className}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1.5 flex-shrink-0">
          <div className="w-full h-full bg-gray-700/50 rounded-full" />
        </div>
        <div className="flex-1 space-y-2">
          <div className={`h-4 ${baseClass} w-3/4`} />
          <div className={`h-4 ${baseClass} w-1/2`} />
          <div className={`h-4 ${baseClass} w-5/6`} />
        </div>
      </div>
    );
  }

  if (type === 'quick-action') {
    return (
      <div className={`grid gap-2 mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`${baseClass} h-12 min-h-[48px] rounded-xl backdrop-blur-sm`}
          />
        ))}
      </div>
    );
  }

  if (type === 'typing') {
    return (
      <div className="flex items-center justify-start space-x-3 p-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1.5 flex-shrink-0">
          <div className="w-full h-full bg-gray-700/50 rounded-full animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-400">AI is thinking...</span>
          </div>
          <div className="text-xs text-gray-500">
            <div className={`${baseClass} h-4 w-32 mb-1`} />
            <div className="w-full bg-gray-700/50 rounded-full h-1">
              <div className={`${baseClass} h-1 rounded-full transition-all duration-300 w-1/3`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'input') {
    return (
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <div className={`${baseClass} h-12 rounded-xl`} />
        </div>
        <div className={`${baseClass} w-10 h-10 rounded-lg`} />
      </div>
    );
  }

  // Default skeleton
  return <div className={`${baseClass} h-4 w-full ${className}`} />;
};

export default SkeletonLoader;