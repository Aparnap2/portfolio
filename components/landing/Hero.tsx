"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const design = {
  section: "relative min-h-[100svh] flex items-center justify-center overflow-hidden",
  container: "relative z-10 max-w-7xl mx-auto px-6 py-20 text-center",
  eyebrow: "uppercase tracking-widest text-neutral-400 text-xs md:text-sm",
  headline:
    "mt-4 text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent",
  sub: "mt-6 text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto",
  ctas: "mt-10 flex flex-col sm:flex-row gap-4 justify-center",
  trustWrap: "mt-10 grid grid-cols-2 md:flex md:flex-wrap gap-4 justify-center text-sm text-neutral-300",
  trustItem: "flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-900/50 border border-neutral-800 transition-all duration-300 hover:bg-neutral-800/70 hover:border-purple-800/50 hover:shadow-lg hover:shadow-purple-900/20",
  beams:
    "pointer-events-none absolute inset-0 [background:radial-gradient(60rem_60rem_at_50%_-10rem,rgba(168,85,247,0.15),transparent_60%),radial-gradient(40rem_40rem_at_80%_20%,rgba(236,72,153,0.10),transparent_50%),radial-gradient(50rem_50rem_at_20%_80%,rgba(244,63,94,0.08),transparent_60%)]",
  codeWrap: "mt-10 mx-auto max-w-3xl rounded-lg border border-neutral-800 bg-neutral-950/80 p-4 text-left shadow-2xl",
  codeLine: "font-mono text-[12px] md:text-sm text-neutral-300",
}

const codeSnippets = [
  "// Event-driven architecture",
  "const workflow = new StateGraph();",
  "workflow.addNode('validate', async (state) => {",
  "  return { ...state, validated: true };",
  "});",
]

export default function Hero() {
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setLines((prev) => (i < codeSnippets.length ? [...prev, codeSnippets[i++]] : prev))
    }, 500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className={design.section} aria-label="Hero section">
      <motion.div 
        className={design.beams} 
        aria-hidden 
        animate={{ 
          background: [
            "radial-gradient(60rem_60rem_at_50%_-10rem,rgba(168,85,247,0.15),transparent_60%),radial-gradient(40rem_40rem_at_80%_20%,rgba(236,72,153,0.10),transparent_50%),radial-gradient(50rem_50rem_at_20%_80%,rgba(244,63,94,0.08),transparent_60%)",
            "radial-gradient(60rem_60rem_at_40%_-5rem,rgba(168,85,247,0.20),transparent_60%),radial-gradient(40rem_40rem_at_70%_30%,rgba(236,72,153,0.15),transparent_50%),radial-gradient(50rem_50rem_at_30%_70%,rgba(244,63,94,0.12),transparent_60%)",
            "radial-gradient(60rem_60rem_at_50%_-10rem,rgba(168,85,247,0.15),transparent_60%),radial-gradient(40rem_40rem_at_80%_20%,rgba(236,72,153,0.10),transparent_50%),radial-gradient(50rem_50rem_at_20%_80%,rgba(244,63,94,0.08),transparent_60%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className={design.container}>
        <motion.p 
          className={design.eyebrow}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          White-Label AI Technical Partner
        </motion.p>
        <motion.h1 
          className={design.headline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          For Agencies That Outgrew No-Code
        </motion.h1>
        <motion.p 
          className={design.sub}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          We build production AI systems—code-first, cost-optimized, SLA-backed—so you can focus on sales and client growth.
        </motion.p>

        <motion.div 
          className={design.ctas}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
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
              <Link href="/work">View Service Menu</Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div 
          className={design.trustWrap} 
          role="list" 
          aria-label="Trust signals"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {[
            { icon: "⚡", text: "LangGraph State Machines" },
            { icon: "💰", text: "30-50% Below GPT-4 Stacks" },
            { icon: "🔒", text: "SLA-Backed Delivery" },
            { icon: "📊", text: "Temporal Memory" },
          ].map((t, i) => (
            <motion.div 
              key={i} 
              className={design.trustItem} 
              role="listitem"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <span aria-hidden>{t.icon}</span>
              <span className="text-neutral-300">{t.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className={design.codeWrap} 
          aria-label="Animated code editor preview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <pre className="overflow-x-auto">
            <AnimatePresence>
              {lines.map((l, i) => (
                <motion.div 
                  key={i} 
                  className={design.codeLine}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  {l}
                </motion.div>
              ))}
            </AnimatePresence>
          </pre>
        </motion.div>
      </div>
    </section>
  )
}
