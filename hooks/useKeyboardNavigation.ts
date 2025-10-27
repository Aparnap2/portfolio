import { useEffect, useCallback } from 'react';

export interface KeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onSpace?: () => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  enabled?: boolean;
  target?: HTMLElement | Window;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onSpace,
    onKeyDown,
    enabled = true,
    target = window
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Call custom onKeyDown handler first
    if (onKeyDown) {
      onKeyDown(event);
    }

    // Prevent default behavior for custom handlers
    let handled = false;

    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
          handled = true;
        }
        break;
      
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
          handled = true;
        }
        break;
      
      case 'ArrowUp':
        if (onArrowUp) {
          event.preventDefault();
          onArrowUp();
          handled = true;
        }
        break;
      
      case 'ArrowDown':
        if (onArrowDown) {
          event.preventDefault();
          onArrowDown();
          handled = true;
        }
        break;
      
      case 'ArrowLeft':
        if (onArrowLeft) {
          event.preventDefault();
          onArrowLeft();
          handled = true;
        }
        break;
      
      case 'ArrowRight':
        if (onArrowRight) {
          event.preventDefault();
          onArrowRight();
          handled = true;
        }
        break;
      
      case 'Tab':
        if (onTab) {
          event.preventDefault();
          onTab(event.shiftKey);
          handled = true;
        }
        break;
      
      case ' ':
      case 'Spacebar':
        if (onSpace) {
          event.preventDefault();
          onSpace();
          handled = true;
        }
        break;
    }

    // Add ARIA live region for screen readers
    if (handled && event.target instanceof HTMLElement) {
      const announcement = event.key === 'Enter' ? 'Activated' : 
                        event.key === 'Escape' ? 'Cancelled' :
                        event.key === 'Tab' ? 'Navigated' : 
                        `Pressed ${event.key}`;
      
      // Announce to screen readers
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      
      document.body.appendChild(liveRegion);
      
      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    }
  }, [enabled, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onSpace, onKeyDown]);

  useEffect(() => {
    if (!enabled) return;

    const element = target;
    
    element.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, enabled, target]);
}

// Focus management utilities
export function useFocusManagement() {
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab - go to previous
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - go to next
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  const restoreFocus = useCallback((previousElement?: HTMLElement) => {
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  }, []);

  return { trapFocus, restoreFocus };
}

// Skip link utilities for accessibility
export function useSkipLinks() {
  useEffect(() => {
    const skipLinks = document.querySelectorAll('[data-skip-link]') as NodeListOf<HTMLAnchorElement>;
    
    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href')?.replace('#', '');
        if (targetId) {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.focus();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    return () => {
      skipLinks.forEach(link => {
        // Cleanup if needed
      });
    };
  }, []);
}