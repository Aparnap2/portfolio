"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// =============================================================================
// HOOK: useAutoScroll
// =============================================================================
export function useAutoScroll(dependencies: any[] = []) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, dependencies);

  return messagesEndRef;
}

// =============================================================================
// HOOK: useMessageHandlers
// =============================================================================
export function useMessageHandlers({ sessionId, isLoading }: { sessionId: string | null; isLoading: boolean }) {
  const lastSubmitTime = useRef<number>(0);
  const SUBMIT_THROTTLE_MS = 1000; // 1 second throttle

  const canSubmit = useCallback(() => {
    const now = Date.now();
    return !isLoading && sessionId && (now - lastSubmitTime.current) > SUBMIT_THROTTLE_MS;
  }, [isLoading, sessionId]);

  const recordSubmit = useCallback(() => {
    lastSubmitTime.current = Date.now();
  }, []);

  return { canSubmit, recordSubmit };
}

// =============================================================================
// HOOK: useKeyboardNavigation
// =============================================================================
export function useKeyboardNavigation(onSubmit: () => void, isLoading: boolean) {
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit, isLoading]);

  return handleKeyPress;
}

// =============================================================================
// HOOK: usePersistentState
// =============================================================================
export function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersistedState = useCallback((value: T) => {
    setState(value);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silent fail for localStorage issues
      }
    }
  }, []);

  return [state, setPersistedState] as const;
}

// =============================================================================
// HOOK: useDebounce
// =============================================================================
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// =============================================================================
// HOOK: usePolling
// =============================================================================
export function usePolling(callback: () => void, interval: number, isActive: boolean = true) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isActive) return;

    const poll = () => {
      callback();
      timeoutRef.current = setTimeout(poll, interval);
    };

    timeoutRef.current = setTimeout(poll, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, interval, isActive]);
}

// =============================================================================
// HOOK: usePrevious
// =============================================================================
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}
