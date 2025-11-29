'use client';
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

const Chatbot = lazy(() => 
  import('./chatbot').catch(() => {
    // Fallback in case of import failure
    return { default: () => null };
  })
);

const LoadingFallback = () => (
  <motion.div
    className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg flex items-center justify-center">
      <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />
      <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
    </div>
  </motion.div>
);

const ErrorFallback = ({ onRetry }) => (
  <motion.div
    className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg flex items-center justify-center group cursor-pointer"
         onClick={onRetry}
         title="Click to retry loading chatbot">
      <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      <div className="absolute inset-0 rounded-full border-2 border-red-300/30 animate-pulse" />
      
      {/* Retry tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900/95 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Failed to load - Click to retry
        <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900/95"></div>
      </div>
    </div>
  </motion.div>
);

const LazyChatbot = () => {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  
  // Reset error state when component mounts
  useEffect(() => {
    setHasError(false);
  }, [retryKey]);
  
  const handleRetry = () => {
    setHasError(false);
    setRetryKey(prev => prev + 1);
  };
  
  const handleError = () => {
    setHasError(true);
  };
  
  if (hasError) {
    return <ErrorFallback onRetry={handleRetry} />;
  }
  
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorBoundary onError={handleError}>
        <Chatbot key={retryKey} />
      </ErrorBoundary>
    </Suspense>
  );
};

// Simple error boundary for the lazy component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Chatbot loading error:', error, errorInfo);
    this.props.onError?.();
  }
  
  render() {
    if (this.state.hasError) {
      return null; // Let parent handle error display
    }
    
    return this.props.children;
  }
}

export default LazyChatbot;