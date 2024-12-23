import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/oLiHaNd.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
