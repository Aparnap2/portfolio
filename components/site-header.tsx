"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="#" className="flex items-center gap-2" aria-label="Home">
          {/* Simple brand mark */}
          <div aria-hidden className="h-6 w-6 rounded-sm bg-primary" />
          <span className="text-sm font-semibold tracking-tight md:text-base">{"Aparna Pradhan"}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <Link href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Services
          </Link>
          <Link href="#work" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Work
          </Link>
          <Link href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Testimonials
          </Link>
          <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="hidden md:block">
          <Button asChild>
            <Link href="#contact">Book a call</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
