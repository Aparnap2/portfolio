import { Suspense } from 'react';
import "./globals.css";
import { firaCode, spaceGrotesk, inter, jetBrainsMono } from './fonts';
import Head from 'next/head';

export const metadata = {
  title: "Aparna Pradhan - Staff+ AI Engineer | Agentic Systems Architect",
  description: "Staff+ AI Engineer specializing in agentic AI systems, LangGraph state machines, and production-grade automation. Building AI agents that replace entire workflows.",
  keywords: "AI engineer, agentic AI, LangGraph, AI automation, production AI systems, workflow automation, AI architecture"
};

// Critical CSS that will be inlined in head
const criticalCSS = `
  /* Add any critical CSS here */
  body { margin: 0; font-family: var(--font-inter), sans-serif; }
  * { box-sizing: border-box; }

  /* Smooth scrolling for better UX */
  html {
    scroll-behavior: smooth;
  }

  /* Focus styles for accessibility */
  *:focus-visible {
    outline: 2px solid #6366f1;
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
    <link
      rel="preload"
      href={`/_next/static/media/${inter.variable.split('--font-')[1]}.woff2`}
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
    <link
      rel="preload"
      href={`/_next/static/media/${jetBrainsMono.variable.split('--font-')[1]}.woff2`}
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
    <html lang="en" className={`dark ${firaCode.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0f" />

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

      <body className="antialiased bg-primary text-primary">
        <Suspense fallback={
          <div
            className="flex justify-center items-center h-screen bg-primary"
            role="status"
            aria-live="polite"
            aria-label="Loading portfolio..."
          >
            <div className="flex flex-col items-center">
              <div className="animate-pulse text-2xl font-bold text-primary mb-4">
                Loading Portfolio
              </div>
              <div
                className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"
                aria-hidden="true"
              ></div>
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        }>
          <main id="main-content" tabIndex="-1" className="focus:outline-none">
            {children}
          </main>
        </Suspense>
      </body>
    </html>
  );
}
