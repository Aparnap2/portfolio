import React from "react"
import { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { PerformanceMonitor } from "@/components/PerformanceMonitor"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ToastProvider } from "@/components/ui/toast-provider"
import "./globals.css"

import { Suspense } from "react"
import { Inter, Geist_Mono } from 'next/font/google'

// Initialize fonts
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata = {
  title: "Aparna Pradhan - Technical Partner for AI Agencies",
  description:
    "Custom-built AI automations for agencies who sell but don't code. Production-grade architecture, full code ownership, 2-6 week delivery.",
  openGraph: {
    title: "Aparna Pradhan - Technical Partner for AI Agencies",
    description: "Custom-built AI automations. You close deals. I build systems that scale.",
    images: ["/og-image.png"],
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} antialiased`}>
      <body className="bg-black text-white font-sans">
        <ErrorBoundary>
          <PerformanceMonitor />
          <ToastProvider>
            <Suspense fallback={<div>Loading...</div>}>
              {children}
              <Analytics />
            </Suspense>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
