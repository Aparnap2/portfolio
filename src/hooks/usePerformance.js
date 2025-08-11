import { useEffect, useRef } from 'react';
import { debounce, throttle, lazyLoadImages } from '@/lib/performance';

/**
 * Custom hook for performance monitoring and optimizations
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableScrollTracking - Whether to track scroll performance
 * @param {boolean} options.enableResizeTracking - Whether to track window resize performance
 * @param {boolean} options.enableLazyLoading - Whether to enable lazy loading of images
 * @param {boolean} options.enableWebVitals - Whether to track Web Vitals
 */
const usePerformance = ({
  enableScrollTracking = true,
  enableResizeTracking = true,
  enableLazyLoading = true,
  enableWebVitals = true,
} = {}) => {
  const scrollHandlerRef = useRef(null);
  const resizeHandlerRef = useRef(null);

  useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      // Mark the start of the page load
      performance.mark('page-load-start');

      // Track when the page is fully loaded
      const handleLoad = () => {
        performance.mark('page-load-end');
        performance.measure('Page Load Time', 'page-load-start', 'page-load-end');
      };

      window.addEventListener('load', handleLoad);

      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !enableScrollTracking) return;

    // Debounced scroll handler
    const handleScroll = debounce(() => {
      // You can add custom scroll tracking logic here
      // For example, track which sections are in view
      const sections = document.querySelectorAll('section[id]');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isInView = (
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.bottom >= 0
        );
        
        if (isInView) {
          // Track visible sections
          console.log(`Section ${section.id} is in view`);
        }
      });
    }, 100);

    scrollHandlerRef.current = handleScroll;
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (scrollHandlerRef.current) {
        window.removeEventListener('scroll', scrollHandlerRef.current);
      }
    };
  }, [enableScrollTracking]);

  useEffect(() => {
    if (typeof window === 'undefined' || !enableResizeTracking) return;

    // Throttled resize handler
    const handleResize = throttle(() => {
      // You can add custom resize tracking logic here
      console.log('Window resized:', {
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 200);

    resizeHandlerRef.current = handleResize;
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
      }
    };
  }, [enableResizeTracking]);

  useEffect(() => {
    if (typeof document === 'undefined' || !enableLazyLoading) return;

    // Initial lazy load
    lazyLoadImages();

    // Set up a MutationObserver to handle dynamically added images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          lazyLoadImages();
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [enableLazyLoading]);

  useEffect(() => {
    if (typeof window === 'undefined' || !enableWebVitals) return;

    // Track Web Vitals
    const reportWebVitals = (metric) => {
      // You can send these metrics to an analytics service
      console.log(metric);
      
      // Example: Send to Google Analytics
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        });
      }
    };

    // Only track Web Vitals in production
    if (process.env.NODE_ENV === 'production') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(reportWebVitals);
        getFID(reportWebVitals);
        getFCP(reportWebVitals);
        getLCP(reportWebVitals);
        getTTFB(reportWebVitals);
      });
    }
  }, [enableWebVitals]);

  return null;
};

export default usePerformance;
