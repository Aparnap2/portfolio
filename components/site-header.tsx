"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-lg font-bold text-white">Aparna Pradhan</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#services" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Services
            </Link>
            <Link href="#about" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              About
            </Link>
            <Link href="#faq" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              FAQ
            </Link>
          </nav>

          <div className="hidden md:block">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 px-6">
              <Link href="/audit">Book Call</Link>
            </Button>
          </div>

          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/10">
            <nav className="flex flex-col gap-4">
              <Link href="#services" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                Services
              </Link>
              <Link href="#about" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                About
              </Link>
              <Link href="#faq" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
                FAQ
              </Link>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 w-full mt-2">
                <Link href="/audit">Book Call</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
