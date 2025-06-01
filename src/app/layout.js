import { Suspense } from 'react';
import "./globals.css";
import { LoadingProvider } from './component/loading/loader';
import { Inter, Fira_Code, Space_Grotesk } from 'next/font/google';
import dynamic from 'next/dynamic';

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
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        }>
          <LoadingProvider>
            {children}
            <Chatbot />
          </LoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
