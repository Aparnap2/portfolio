import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for monitoring chatbot performance metrics
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableMetrics - Whether to collect performance metrics
 * @param {boolean} options.enableMemoryTracking - Whether to track memory usage
 * @param {Function} options.onMetric - Callback for when metrics are collected
 */
export const useChatbotPerformance = ({
  enableMetrics = true,
  enableMemoryTracking = false,
  onMetric = null
} = {}) => {
  const metricsRef = useRef({
    messageCount: 0,
    averageResponseTime: 0,
    totalResponseTime: 0,
    errorCount: 0,
    retryCount: 0,
    streamingStartTime: null,
    lastInteractionTime: Date.now()
  });

  const performanceObserverRef = useRef(null);
  const memoryIntervalRef = useRef(null);

  // Track message response time
  const trackMessageStart = useCallback(() => {
    if (!enableMetrics) return;
    
    metricsRef.current.streamingStartTime = performance.now();
    metricsRef.current.lastInteractionTime = Date.now();
  }, [enableMetrics]);

  const trackMessageEnd = useCallback(() => {
    if (!enableMetrics || !metricsRef.current.streamingStartTime) return;
    
    const responseTime = performance.now() - metricsRef.current.streamingStartTime;
    const metrics = metricsRef.current;
    
    metrics.messageCount += 1;
    metrics.totalResponseTime += responseTime;
    metrics.averageResponseTime = metrics.totalResponseTime / metrics.messageCount;
    metrics.streamingStartTime = null;
    
    const metricData = {
      type: 'message_response',
      responseTime,
      averageResponseTime: metrics.averageResponseTime,
      messageCount: metrics.messageCount,
      timestamp: Date.now()
    };
    
    onMetric?.(metricData);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Chatbot Response Time:', `${responseTime.toFixed(2)}ms`);
    }
  }, [enableMetrics, onMetric]);

  // Track errors
  const trackError = useCallback((error, context = '') => {
    if (!enableMetrics) return;
    
    metricsRef.current.errorCount += 1;
    
    const metricData = {
      type: 'error',
      error: error.message || error,
      context,
      errorCount: metricsRef.current.errorCount,
      timestamp: Date.now()
    };
    
    onMetric?.(metricData);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Chatbot Error:', error, context);
    }
  }, [enableMetrics, onMetric]);

  // Track retries
  const trackRetry = useCallback((reason = '') => {
    if (!enableMetrics) return;
    
    metricsRef.current.retryCount += 1;
    
    const metricData = {
      type: 'retry',
      reason,
      retryCount: metricsRef.current.retryCount,
      timestamp: Date.now()
    };
    
    onMetric?.(metricData);
  }, [enableMetrics, onMetric]);

  // Get current metrics
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      messageCount: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      errorCount: 0,
      retryCount: 0,
      streamingStartTime: null,
      lastInteractionTime: Date.now()
    };
  }, []);

  // Track memory usage
  useEffect(() => {
    if (!enableMemoryTracking || typeof window === 'undefined') return;

    const trackMemory = () => {
      if (performance.memory) {
        const memoryInfo = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
        
        const metricData = {
          type: 'memory',
          ...memoryInfo,
          timestamp: Date.now()
        };
        
        onMetric?.(metricData);
        
        // Warn if memory usage is high
        const usagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
        if (usagePercent > 80) {
          console.warn('High memory usage detected:', `${usagePercent.toFixed(1)}%`);
        }
      }
    };

    // Track memory every 30 seconds
    memoryIntervalRef.current = setInterval(trackMemory, 30000);
    trackMemory(); // Initial measurement

    return () => {
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
      }
    };
  }, [enableMemoryTracking]); // Remove onMetric to prevent infinite loop

  // Track performance entries
  useEffect(() => {
    if (!enableMetrics || typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.name.includes('chatbot') || entry.entryType === 'measure') {
            const metricData = {
              type: 'performance',
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              entryType: entry.entryType,
              timestamp: Date.now()
            };
            
            onMetric?.(metricData);
          }
        });
      });

      performanceObserverRef.current.observe({
        entryTypes: ['measure', 'navigation', 'resource']
      });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [enableMetrics]); // Remove onMetric to prevent infinite loop

  // Track user engagement
  const trackEngagement = useCallback((action, data = {}) => {
    if (!enableMetrics) return;
    
    const metricData = {
      type: 'engagement',
      action,
      data,
      sessionDuration: Date.now() - metricsRef.current.lastInteractionTime,
      timestamp: Date.now()
    };
    
    onMetric?.(metricData);
    metricsRef.current.lastInteractionTime = Date.now();
  }, [enableMetrics]);

  return {
    trackMessageStart,
    trackMessageEnd,
    trackError,
    trackRetry,
    trackEngagement,
    getMetrics,
    resetMetrics
  };
};