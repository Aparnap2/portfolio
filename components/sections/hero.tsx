"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="border-b bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-14 md:grid-cols-2 md:gap-10 md:px-6 lg:py-20">
        <div className="flex flex-col gap-6">
          <h1 id="hero-heading" className="text-pretty text-3xl font-semibold tracking-tight md:text-5xl">
            {"Technical Execution Partner for AI Agencies"}
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {
              "Ship reliable, production-grade AI features faster. From data pipelines to evals, I turn product ideas into working systems that scale."
            }
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <Link href="#contact">Book a call</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="#work">See case studies</Link>
            </Button>
          </div>

          <div aria-label="Highlights" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-md border px-3 py-1">
              <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
              {"LLM Apps"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border px-3 py-1">
              <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
              {"Tooling & Evals"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border px-3 py-1">
              <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
              {"Data Pipelines"}
            </span>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-lg border md:max-w-md">
          <Image
            alt="Abstract AI system diagram"
            src="/abstract-ai-system-diagram.jpg"
            fill
            priority
            sizes="(min-width: 768px) 420px, 90vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
