'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startLoading = () => setLoadingCount(prev => prev + 1);
  const stopLoading = () => setLoadingCount(prev => Math.max(prev - 1, 0));

  useEffect(() => {
    startLoading();
    const timeout = setTimeout(stopLoading, 300);
    return () => {
      clearTimeout(timeout);
      stopLoading();
    };
  }, [pathname, searchParams]);

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
      {isLoading && (
        <div className="loading-spinner-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};