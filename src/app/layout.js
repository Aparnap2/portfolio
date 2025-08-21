import { Suspense } from 'react';
import "./globals.css";
import { LoadingProvider } from './component/loading/loader';
import { firaCode, spaceGrotesk } from './fonts';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import Chatbot with no SSR to avoid hydration issues
const Chatbot = dynamic(
  () => import('./component/chatbot/chatbot'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed bottom-4 right-4 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
      </div>
    )
  }
);

export const metadata = {
  title: "Aparna Pradhan - AI and Full-Stack Developer",
  description: "The portfolio of Aparna Pradhan, a full-stack developer specializing in building intelligent AI-powered applications.",
  keywords: "AI developer, full-stack developer, portfolio, web developer, software engineer, LangChain, Next.js, React"
};

// Critical CSS that will be inlined in the head
const criticalCSS = `
  /* Add any critical CSS here */
  body { margin: 0; font-family: ${spaceGrotesk.style.fontFamily}, sans-serif; }
  * { box-sizing: border-box; }
  
  /* Smooth scrolling for better UX */
  html {
    scroll-behavior: smooth;
  }
  
  /* Focus styles for accessibility */
  *:focus-visible {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
  }
`;

// Preload critical assets
const PreloadLinks = () => (
  <>
    {/* Preload critical fonts */}
    <link
      rel="preload"
      href={`/_next/static/media/${firaCode.variable.split('--font-')[1]}.woff2`}
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
    <link
      rel="preload"
      href={`/_next/static/media/${spaceGrotesk.variable.split('--font-')[1]}.woff2`}
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
    {/* Preload critical assets */}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
  </>
);

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${firaCode.variable} ${spaceGrotesk.variable}`}>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
        
        {/* Critical CSS */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        
        {/* Preload critical assets */}
        <PreloadLinks />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      
      <body className="antialiased bg-gray-900 text-gray-100">
        <Suspense fallback={
          <div 
            className="flex justify-center items-center h-screen bg-gray-900" 
            role="status" 
            aria-live="polite"
            aria-label="Loading portfolio..."
          >
            <div className="flex flex-col items-center">
              <div className="animate-pulse text-2xl font-bold text-white mb-4">
                Loading Portfolio
              </div>
              <div 
                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"
                aria-hidden="true"
              ></div>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        }>
          <LoadingProvider>
            <main id="main-content" tabIndex="-1" className="focus:outline-none">
              {children}
            </main>
            <Chatbot />
          </LoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
