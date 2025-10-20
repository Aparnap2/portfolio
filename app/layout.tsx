import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

import { Suspense } from "react"
import { Inter, Geist_Mono, Inter as V0_Font_Inter, Geist_Mono as V0_Font_Geist_Mono, Source_Serif_4 as V0_Font_Source_Serif_4 } from 'next/font/google'
import { AuditChatbot } from "@/components/audit/AuditChatbot"

// Initialize fonts
const _inter = V0_Font_Inter({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _sourceSerif_4 = V0_Font_Source_Serif_4({ subsets: ['latin'], weight: ["200","300","400","500","600","700","800","900"] })

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
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
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} antialiased`}>
      <body className="bg-black text-white font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <Analytics />
          <AuditChatbot />
        </Suspense>
      </body>
    </html>
  )
}
