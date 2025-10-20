"use client"

import dynamic from "next/dynamic"

const Process = dynamic(() => import("@/components/landing/Process"), { ssr: false })
const Pricing = dynamic(() => import("@/components/landing/Pricing"), { ssr: false })
const CaseStudies = dynamic(() => import("@/components/landing/CaseStudies"), { ssr: false })

export function DynamicLandingSections() {
  return (
    <>
      <Process />
      <Pricing />
      <CaseStudies />
    </>
  )
}
