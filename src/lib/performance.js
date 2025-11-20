/**
 * Performance optimization utilities
 */

// Debounce function to limit the rate at which a function can fire
// eslint-disable-next-line func-names
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function to limit the rate at which a function can fire
// eslint-disable-next-line func-names
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Function to check if an element is in the viewport
export const isInViewport = (element) => {
  if (typeof window === 'undefined' || !element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Function to lazy load images
export const lazyLoadImages = () => {
  if (typeof window === 'undefined') return;
  
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });
  
  lazyImages.forEach((img) => {
    imageObserver.observe(img);
  });
};

// Function to add performance marks
export const mark = (name) => {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.mark(name);
  }
};

// Function to measure performance between two marks
export const measure = (name, startMark, endMark) => {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      window.performance.measure(name, startMark, endMark);
      const entries = window.performance.getEntriesByName(name);
      return entries[0].duration;
    } catch (e) {
      // Silently fail in case marks don't exist
      return 0;
    }
  }
  return 0;
};

// Function to get Web Vitals
// This should be called during page load
export const getWebVitals = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Log to console or send to analytics
        console.log(entry.name, entry.startTime, entry.duration);
      }
    });
    
    observer.observe({ entryTypes: ['paint', 'longtask', 'measure', 'resource'] });
  }
};

// Function to preload resources
export const preloadResource = (url, as = 'script') => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
};

// Function to prefetch resources
export const prefetchResource = (url, as = 'script') => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
};
