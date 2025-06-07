import { Suspense } from 'react';
import "./globals.css";
import { LoadingProvider } from './component/loading/loader';
import { Inter, Fira_Code, Space_Grotesk } from 'next/font/google';
import dynamic from 'next/dynamic';
import { PortfolioProvider } from '../context/PortfolioContext';

// Dynamically import Chatbot with no SSR to avoid hydration issues
const Chatbot = dynamic(() => import('./component/chatbot/chatbot'), {
  ssr: false,
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: "Aparna Pradhan Portfolio",
  description: " Hi ! , I am Aparna Pradhan ,  a full-stack web developer with expertise in spaceGrotesklogies such as MERN (MongoDB, Express, React, Node.js), Next.js, Django, and React Native. My specialization lies in integrating AI solutions, including machine learning, natural language processing, computer vision, large language models, optical character recognition, predictive analytics, recommendation systems, vector search, and retrieval-augmented generation (RAG) systems. I have experience working on a variety of niche projects, including SaaS, healthcare, edtech, finance, and e-commerce.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${firaCode.variable} ${spaceGrotesk.variable} antialiased`}
      > 
        <Suspense fallback={
          <div className="flex justify-center items-center h-screen bg-gray-900">
            <div className="flex flex-col items-center">
              <div className="animate-pulse text-2xl font-bold text-white mb-4">Loading Portfolio</div>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          </div>
        }>
          <PortfolioProvider>
            <LoadingProvider>
              {children}
              <Chatbot />
            </LoadingProvider>
          </PortfolioProvider>
        </Suspense>
      </body>
    </html>
  );
}
