import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { MetricsCollector } from '@/lib/metrics';

// Hook for memoizing expensive computations
export function useMemoizedCallback(
  fn: (...args: any[]) => any,
  deps: React.DependencyList,
  options: {
    maxSize?: number;
    key?: string;
  } = {}
) {
  const { maxSize = 100, key } = options;
  const cacheRef = useRef<Map<string, any>>(new Map());
  
  return useCallback((...args: any[]) => {
    const cacheKey = key ? `${key}-${JSON.stringify(args)}` : JSON.stringify(args);
    
    // Check cache first
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }
    
    // Compute and cache result
    const result = fn(...args);
    
    // Limit cache size
    if (cacheRef.current.size >= maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) {
        cacheRef.current.delete(firstKey);
      }
    }
    
    cacheRef.current.set(cacheKey, result);
    return result;
  }, deps);
}

// Hook for virtual scrolling (performance optimization for long lists)
export function useVirtualScrolling<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  } = { itemHeight: 50, containerHeight: 400, overscan: 5 }
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const scrollTop = useRef(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop.current / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop.current + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [items.length, itemHeight, containerHeight, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    scrollTop.current = e.currentTarget.scrollTop;
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex: visibleRange.startIndex,
    endIndex: visibleRange.endIndex
  };
}

// Hook for lazy loading components
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  options: {
    threshold?: number;
    rootMargin?: string;
    triggerOnce?: boolean;
  } = {}
) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loaded, setLoaded] = useState(false);
  
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    if (!elementRef.current || loaded) return;
    
    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        
        if (entry.isIntersecting && (!triggerOnce || !loaded)) {
          setLoading(true);
          setError(null);
          
          try {
            const result = await loader();
            setData(result);
            setLoaded(true);
            
            // Track performance metrics
            MetricsCollector.getInstance().increment('lazy_load_success', 1, {
              component: loader.name || 'unknown'
            });
          } catch (err) {
            setError(err as Error);
            MetricsCollector.getInstance().increment('lazy_load_error', 1, {
              component: loader.name || 'unknown'
            });
          } finally {
            setLoading(false);
          }
          
          if (triggerOnce) {
            observerRef.current?.disconnect();
          }
        }
      },
      { threshold, rootMargin }
    );
    
    observerRef.current.observe(elementRef.current);
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, loaded, loader]);
  
  return {
    data,
    loading,
    error,
    loaded,
    elementRef
  };
}

// Hook for debounced API calls
export function useDebouncedApi<T>(
  apiCall: (...args: any[]) => Promise<T>,
  delay: number = 300
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<any[] | null>(null);
  
  const execute = useCallback((...args: any[]) => {
    lastArgsRef.current = args;
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        const startTime = Date.now();
        const result = await apiCall(...args);
        const duration = Date.now() - startTime;
        
        setState({
          data: result,
          loading: false,
          error: null
        });
        
        // Track API performance
        MetricsCollector.getInstance().timing('api_call', duration, {
          endpoint: apiCall.name || 'unknown'
        });
        
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error as Error
        });
        
        MetricsCollector.getInstance().increment('api_call_error', 1, {
          endpoint: apiCall.name || 'unknown'
        });
      }
    }, delay);
  }, [apiCall, delay]);
  
  // Cancel pending call
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);
  
  // Immediate execution (bypass debounce)
  const executeImmediate = useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    return execute(...args);
  }, [execute]);
  
  return {
    ...state,
    execute,
    executeImmediate,
    cancel,
    hasPendingCall: !!timeoutRef.current
  };
}

// Hook for resource preloading
export function useResourcePreload() {
  const preloadedResources = useRef<Set<string>>(new Set());
  
  const preload = useCallback((resources: string[]) => {
    resources.forEach(resource => {
      if (preloadedResources.current.has(resource)) return;
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      
      // Determine resource type
      if (resource.endsWith('.js')) {
        link.as = 'script';
      } else if (resource.endsWith('.css')) {
        link.as = 'style';
      } else if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        link.as = 'image';
      } else if (resource.match(/\.(woff|woff2|ttf)$/i)) {
        link.as = 'font';
      }
      
      document.head.appendChild(link);
      preloadedResources.current.add(resource);
      
      // Track preloading
      MetricsCollector.getInstance().increment('resource_preload', 1, {
        type: link.as || 'unknown'
      });
    });
  }, []);
  
  const isPreloaded = useCallback((resource: string) => {
    return preloadedResources.current.has(resource);
  }, []);
  
  return { preload, isPreloaded };
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    // Track render performance
    MetricsCollector.getInstance().timing('component_render', timeSinceLastRender, {
      component: componentName,
      render_count: renderCount.current.toString()
    });
    
    // Warn about excessive re-renders
    if (renderCount.current > 10) {
      console.warn(`Component ${componentName} has rendered ${renderCount.current} times`);
    }
    
    lastRenderTime.current = now;
  });
  
  const getRenderStats = useCallback(() => ({
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  }), []);
  
  return { getRenderStats };
}

// Hook for intersection observer (reusable)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {},
  callback?: (entries: IntersectionObserverEntry[]) => void
) {
  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<Element>>(new Set());
  
  const observe = useCallback((element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((observedEntries) => {
        setEntries(observedEntries);
        callback?.(observedEntries);
      }, options);
    }
    
    observerRef.current.observe(element);
    elementsRef.current.add(element);
  }, [options, callback]);
  
  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
    elementsRef.current.delete(element);
  }, []);
  
  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    elementsRef.current.clear();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return disconnect;
  }, [disconnect]);
  
  return {
    entries,
    observe,
    unobserve,
    disconnect
  };
}

// Hook for media queries (responsive behavior)
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);
  
  return matches;
}