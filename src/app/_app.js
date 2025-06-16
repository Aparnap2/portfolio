import { useEffect } from 'react';
import { useRouter } from 'next/router';
import usePerformance from '@/hooks/usePerformance';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Initialize performance monitoring
  usePerformance({
    enableScrollTracking: true,
    enableResizeTracking: true,
    enableLazyLoading: true,
    enableWebVitals: process.env.NODE_ENV === 'production',
  });

  // Track page views
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('config', 'YOUR_GA_MEASUREMENT_ID', {
          page_path: url,
        });
      }
    };

    // Track the first pageview
    handleRouteChange(window.location.pathname);

    // Track subsequent pageviews
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Add a class to the body when the page is loading
  useEffect(() => {
    const handleStart = () => {
      document.body.classList.add('page-transitioning');
    };
    
    const handleComplete = () => {
      document.body.classList.remove('page-transitioning');
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
