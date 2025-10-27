"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export default function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="relative overflow-hidden">
      <motion.div
        className="absolute inset-0 [background:radial-gradient(80rem_80rem_at_20%_0%,rgba(168,85,247,0.20),transparent_60%),radial-gradient(60rem_60rem_at_80%_20%,rgba(236,72,153,0.15),transparent_60%),radial-gradient(70rem_70rem_at_50%_80%,rgba(244,63,94,0.12),transparent_60%)]"
        aria-hidden
        animate={{ 
          opacity: [0.3, 0.6, 0.3] 
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24 text-center" ref={ref}>
        <motion.h2 
          className="text-5xl md:text-6xl font-bold tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          Ready to Scale Beyond No-Code?
        </motion.h2>
        <motion.p 
          className="mt-4 text-neutral-300"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Book a 15-minute discovery call to discuss your agency's technical needs. We'll outline a roadmap for your next AI project.
        </motion.p>
        <motion.div 
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              asChild
              className="h-14 px-8 text-base font-medium shadow-[0_0_40px_rgba(168,85,247,0.35)] bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:shadow-[0_0_60px_rgba(168,85,247,0.5)] transition-all duration-300"
            >
              <Link href="/audit">Book 15-Min Intro</Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild variant="outline" className="h-14 px-8 text-base font-medium border-neutral-700 bg-black hover:bg-neutral-900 hover:border-purple-800 transition-all duration-300">
              <Link href="/contact">Download Service Menu</Link>
            </Button>
          </motion.div>
        </motion.div>
        <motion.div 
          className="mt-4 text-sm text-neutral-400"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          No commitment • Technical consultation • SLA-backed proposals
        </motion.div>
      </div>
    </section>
  )
}
