import { Suspense } from 'react';
import "./globals.css";
import { LoadingProvider } from './component/loading/loader';
import { firaCode, spaceGrotesk } from './fonts';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically import components with no SSR to avoid hydration issues
const Chatbot = dynamic(
  () => import('./component/chatbot/chatbot'),
  { 
    ssr: false,
    loading: () => (
      <div className="fixed bottom-20 right-6 md:bottom-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg z-50">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
      </div>
    )
  }
);

const FloatingNavigation = dynamic(
  () => import('./component/ui/FloatingNavigation'),
  { ssr: false }
);

export const metadata = {
  title: "Aparna Pradhan | Full-Stack Developer & AI Specialist",
  description: "Full-stack web developer specializing in MERN, Next.js, and AI/ML solutions. Let's build something amazing together!",
  keywords: [
    'Aparna Pradhan',
    'Full Stack Developer',
    'MERN Stack',
    'Next.js',
    'AI/ML Engineer',
    'Web Development',
    'Portfolio'
  ],
  authors: [{ name: 'Aparna Pradhan' }],
  openGraph: {
    title: 'Aparna Pradhan | Full-Stack Developer & AI Specialist',
    description: 'Full-stack web developer specializing in MERN, Next.js, and AI/ML solutions.',
    url: 'https://aparnapradhanportfolio.netlify.app',
    siteName: 'Aparna Pradhan Portfolio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aparna Pradhan | Full-Stack Developer & AI Specialist',
    description: 'Full-stack web developer specializing in MERN, Next.js, and AI/ML solutions.',
    creator: '@yourtwitterhandle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Critical CSS that will be inlined in the head
const criticalCSS = `
  /* Add any critical CSS here */
  body { margin: 0; font-family: ${spaceGrotesk.style.fontFamily}, sans-serif; }
  * { box-sizing: border-box; }
  
  /* Smooth scrolling for better UX */
  html {
    scroll-behavior: smooth;
    background-color: #0f172a; /* slate-900 */
  }
  
  /* Focus styles for accessibility */
  *:focus-visible {
    outline: 2px solid #8b5cf6;
    outline-offset: 2px;
  }
`;

// Preload critical assets
// const PreloadLinks = () => (
//   <>
//     {/* Preload critical fonts */}
//     <link
//       rel="preload"
//       href={`/_next/static/media/${firaCode.variable.split('--font-')[1]}.woff2`}
//       as="font"
//       type="font/woff2"
//       crossOrigin="anonymous"
//     />
//     <link
//       rel="preload"
//       href={`/_next/static/media/${spaceGrotesk.variable.split('--font-')[1]}.woff2`}
//       as="font"
//       type="font/woff2"
//       crossOrigin="anonymous"
//     />
//     {/* Preload critical assets */}
//     <link rel="preconnect" href="https://fonts.googleapis.com" />
//     <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
//     <link rel="preconnect" href="https://fonts.gstatic.com" />
//   </>
// );

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${firaCode.variable} ${spaceGrotesk.variable}`}>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
        
        {/* Critical CSS */}
        <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
        
        {/* Preconnect to Google Fonts - next/font handles preloading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      
      <body className="antialiased text-gray-100 bg-slate-900">
        <Suspense fallback={
          <div 
            className="flex justify-center items-center h-screen bg-slate-900" 
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
            <FloatingNavigation />
            <Chatbot />
          </LoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
