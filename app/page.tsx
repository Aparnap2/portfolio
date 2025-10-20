import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

import Hero from "@/components/landing/Hero"
import SocialProof from "@/components/landing/SocialProof"
import About from "@/components/landing/About"
import Services from "@/components/landing/Services"
import FAQ from "@/components/landing/FAQ"
import FinalCTA from "@/components/landing/FinalCTA"

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <SocialProof />
        <About />
        <Services />
        <FAQ />
        <FinalCTA />
      </main>
      <SiteFooter />
    </>
  )
}
