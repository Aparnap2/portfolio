import { Suspense } from 'react';
import localFont from "next/font/local";
import "./globals.css";
import { LoadingProvider } from './component/loading/loader';
const techno = localFont({
  src: "./fonts/technospheredemo-x3rkq.woff2",
  variable: "--font-geist-sans",
  weight: "90 900",
});
const railway = localFont({
  src: "./fonts/raleway-regular-webfont.woff2",
  variable: "--font-raleway-sans",
  weight: "90 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Aparna Pradhan Portfolio",
  description: " Hi ! , I am Aparna Pradhan ,  a full-stack web developer with expertise in technologies such as MERN (MongoDB, Express, React, Node.js), Next.js, Django, and React Native. My specialization lies in integrating AI solutions, including machine learning, natural language processing, computer vision, large language models, optical character recognition, predictive analytics, recommendation systems, vector search, and retrieval-augmented generation (RAG) systems. I have experience working on a variety of niche projects, including SaaS, healthcare, edtech, finance, and e-commerce.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${techno.variable} ${railway.variable} ${geistMono.variable} antialiased`}
      > 
        <Suspense fallback={
          <><div className="flex justify-center items-center h-screen"></div><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div></>
        }>
          <LoadingProvider>
            {children}
          </LoadingProvider>
        </Suspense>
      </body>
    </html>
  );
}
