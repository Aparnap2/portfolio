import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Custom hook for responsive design utilities
 * @param {Object} breakpoints - Custom breakpoints object
 * @returns {Object} Responsive utilities and current screen info
 */
export const useResponsive = (breakpoints = {}) => {
  const defaultBreakpoints = useMemo(() => ({
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
    ...breakpoints
  }), [breakpoints]);

  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    breakpoint: 'xs',
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'portrait',
    pixelRatio: 1,
    isTouch: false,
    prefersReducedMotion: false,
    colorScheme: 'dark'
  });

  // Debounce screen updates for better performance
  const debouncedScreenInfo = useDebounce(screenInfo, 150);

  // Enhanced safe area utilities for mobile devices
  const getSafeAreaInsets = useCallback(() => {
    if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10),
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10),
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10),
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10)
    };
  }, []);

  const updateScreenInfo = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;
    const orientation = width > height ? 'landscape' : 'portrait';
    
    // Determine current breakpoint
    let currentBreakpoint = 'xs';
    const sortedBreakpoints = Object.entries(defaultBreakpoints)
      .sort(([, a], [, b]) => b - a);
    
    for (const [name, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        currentBreakpoint = name;
        break;
      }
    }

    // Enhanced device type detection with better mobile/tablet boundaries
    const isMobile = width < defaultBreakpoints.md;
    const isTablet = width >= defaultBreakpoints.md && width < defaultBreakpoints.lg;
    const isDesktop = width >= defaultBreakpoints.lg;
    const isSmallMobile = width < 375; // iPhone SE, older devices
    const isLargeMobile = width >= 375 && width < defaultBreakpoints.md; // Modern phones
    
    // Enhanced touch detection
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    
    // Accessibility preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Safe area insets for notched devices
    const safeAreaInsets = getSafeAreaInsets();

    setScreenInfo({
      width,
      height,
      breakpoint: currentBreakpoint,
      isMobile,
      isTablet,
      isDesktop,
      isSmallMobile,
      isLargeMobile,
      orientation,
      pixelRatio,
      isTouch,
      isCoarsePointer,
      prefersReducedMotion,
      colorScheme,
      prefersHighContrast,
      safeAreaInsets
    });
  }, [defaultBreakpoints, getSafeAreaInsets]);

  // Media query utilities
  const isBreakpoint = useCallback((breakpoint) => {
    return screenInfo.breakpoint === breakpoint;
  }, [screenInfo.breakpoint]);

  const isBreakpointUp = useCallback((breakpoint) => {
    const currentWidth = screenInfo.width;
    const targetWidth = defaultBreakpoints[breakpoint] || 0;
    return currentWidth >= targetWidth;
  }, [screenInfo.width, defaultBreakpoints]);

  const isBreakpointDown = useCallback((breakpoint) => {
    const currentWidth = screenInfo.width;
    const targetWidth = defaultBreakpoints[breakpoint] || 0;
    return currentWidth < targetWidth;
  }, [screenInfo.width, defaultBreakpoints]);

  const isBreakpointBetween = useCallback((minBreakpoint, maxBreakpoint) => {
    const currentWidth = screenInfo.width;
    const minWidth = defaultBreakpoints[minBreakpoint] || 0;
    const maxWidth = defaultBreakpoints[maxBreakpoint] || Infinity;
    return currentWidth >= minWidth && currentWidth < maxWidth;
  }, [screenInfo.width, defaultBreakpoints]);

  // Responsive value selector
  const getResponsiveValue = useCallback((values) => {
    if (typeof values !== 'object' || values === null) {
      return values;
    }

    const sortedBreakpoints = Object.entries(defaultBreakpoints)
      .sort(([, a], [, b]) => b - a);

    for (const [breakpoint] of sortedBreakpoints) {
      if (values[breakpoint] !== undefined && isBreakpointUp(breakpoint)) {
        return values[breakpoint];
      }
    }

    // Fallback to default value or first available value
    return values.default || values[Object.keys(values)[0]];
  }, [defaultBreakpoints, isBreakpointUp]);

  // CSS class generator for responsive utilities
  const getResponsiveClasses = useCallback((baseClass, responsiveClasses = {}) => {
    const classes = [baseClass];
    
    Object.entries(responsiveClasses).forEach(([breakpoint, className]) => {
      if (isBreakpointUp(breakpoint)) {
        classes.push(className);
      }
    });
    
    return classes.filter(Boolean).join(' ');
  }, [isBreakpointUp]);

  // Enhanced viewport utilities with better mobile support
  const getViewportInfo = useCallback(() => {
    const { width, height } = screenInfo;
    const aspectRatio = width / height;
    const isLandscape = aspectRatio > 1;
    const isPortrait = aspectRatio <= 1;
    
    // Calculate available viewport space accounting for safe areas
    const safeAreaInsets = getSafeAreaInsets();
    const availableWidth = width - safeAreaInsets.left - safeAreaInsets.right;
    const availableHeight = height - safeAreaInsets.top - safeAreaInsets.bottom;
    
    return {
      width,
      height,
      aspectRatio,
      isLandscape,
      isPortrait,
      availableWidth,
      availableHeight,
      safeAreaInsets
    };
  }, [screenInfo, getSafeAreaInsets]);

  // Enhanced touch and interaction utilities
  const getInteractionInfo = useCallback(() => {
    return {
      isTouch: screenInfo.isTouch,
      isCoarsePointer: screenInfo.isCoarsePointer,
      supportsHover: !screenInfo.isTouch && !screenInfo.isCoarsePointer,
      prefersReducedMotion: screenInfo.prefersReducedMotion,
      prefersHighContrast: screenInfo.prefersHighContrast
    };
  }, [screenInfo]);

  // Enhanced viewport utilities
  const getViewportSize = useCallback(() => {
    return getViewportInfo();
  }, [getViewportInfo]);

  // Setup event listeners
  useEffect(() => {
    updateScreenInfo(); // Initial call

    const handleResize = () => updateScreenInfo();
    const handleOrientationChange = () => {
      // Delay to ensure dimensions are updated after orientation change
      setTimeout(updateScreenInfo, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

    // Listen for media query changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ];

    const handleMediaQueryChange = () => updateScreenInfo();
    mediaQueries.forEach(mq => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleMediaQueryChange);
      } else {
        // Fallback for older browsers
        mq.addListener(handleMediaQueryChange);
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleMediaQueryChange);
        } else {
          mq.removeListener(handleMediaQueryChange);
        }
      });
    };
  }, [updateScreenInfo]);

  return {
    // Current screen information
    ...debouncedScreenInfo,
    
    // Breakpoint utilities
    isBreakpoint,
    isBreakpointUp,
    isBreakpointDown,
    isBreakpointBetween,
    
    // Responsive utilities
    getResponsiveValue,
    getResponsiveClasses,
    getSafeAreaInsets,
    getViewportSize,
    getViewportInfo,
    getInteractionInfo,
    
    // Breakpoints reference
    breakpoints: defaultBreakpoints
  };
};