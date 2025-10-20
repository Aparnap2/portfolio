"use client"

import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

const design = {
  section: "py-20 px-6 bg-neutral-950 border-t border-neutral-900",
  container: "max-w-7xl mx-auto",
  header: "text-center mb-16",
  eyebrow: "uppercase tracking-widest text-neutral-400 text-xs md:text-sm mb-4",
  title: "text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent mb-6",
  subtitle: "text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto",
  grid: "grid md:grid-cols-2 gap-8 mb-12",
  card: "bg-neutral-900/50 border border-neutral-800 rounded-lg p-6 transition-all duration-300 hover:bg-neutral-800/70 hover:border-purple-800/30 hover:shadow-lg hover:shadow-purple-900/10",
  cardTitle: "text-xl font-semibold text-white mb-3",
  cardText: "text-neutral-300 leading-relaxed",
  features: "grid md:grid-cols-2 lg:grid-cols-4 gap-6",
  feature: "text-center",
  icon: "text-3xl mb-2 transition-transform duration-300 group-hover:scale-110",
  featureTitle: "font-medium text-white mb-1",
  featureText: "text-sm text-neutral-400",
  icpBox: "mt-16 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-800/30 rounded-lg p-8 text-center",
  icpTitle: "text-2xl font-semibold text-white mb-4",
  icpText: "text-neutral-300 text-lg",
}

export default function About() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className={design.section} aria-label="About section">
      <div className={design.container}>
        <div className={design.header}>
          <motion.p 
            className={design.eyebrow}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            About
          </motion.p>
          <motion.h2 
            className={design.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            We're a full-stack AI development partner for agencies that have hit the limits of n8n, Make, or Zapier
          </motion.h2>
          <motion.p 
            className={design.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            When your clients need real performance, compliance, or scale—not just prototypes—we deliver code-first systems in Python, LangGraph, and FastAPI, deployed on your infrastructure or ours.
          </motion.p>
        </div>

        <div className={design.grid}>
          <motion.div 
            className={design.card}
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h3 className={design.cardTitle}>What makes us different</h3>
            <motion.p 
              className={design.cardText}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <strong>Code-first architecture:</strong> LangGraph state machines, validators, and per-field escalation instead of brittle prompt chains.
            </motion.p>
            <motion.p 
              className={design.cardText + " mt-4"}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <strong>Cost & performance by design:</strong> Pre-LLM structure extraction (Docling OSS), snippet prompting (200–400 tokens), small-model routing (Groq 8B for 80–95% of calls), aggressive caching, and batch processing.
            </motion.p>
            <motion.p 
              className={design.cardText + " mt-4"}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <strong>Temporal memory:</strong> Long-term knowledge graphs (Neo4j with valid_from/valid_to provenance) + LangGraph short-term state = auditable, time-scoped answers with zero hallucination drift.
            </motion.p>
            <motion.p 
              className={design.cardText + " mt-4"}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <strong>Operability & SLAs:</strong> Health checks, idempotent webhooks, structured logs, acceptance tests, and 30-day bug warranties.
            </motion.p>
          </motion.div>

          <motion.div 
            className={design.card}
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h3 className={design.cardTitle}>Tech Stack Transparency</h3>
            <motion.div 
              className="flex flex-wrap gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {[
                "LangGraph", "FastAPI", "Neo4j", "Groq Llama-3",
                "Docling", "PostgreSQL", "Redis", "Docker",
                "FAISS", "PaddleOCR", "Python", "TypeScript"
              ].map((tech, i) => (
                <motion.div
                  key={tech}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 border-neutral-700 cursor-pointer transition-all duration-200 hover:bg-purple-800/30 hover:border-purple-700">
                    {tech}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className={design.features}>
          {[
            { icon: "🏗️", title: "Code-First", text: "LangGraph state machines, not prompt chains" },
            { icon: "💰", title: "Cost-Optimized", text: "80-95% Groq 8B routing, snippet prompting" },
            { icon: "📊", title: "Temporal Memory", text: "Neo4j + time-scoped provenance" },
            { icon: "🔒", title: "SLA-Backed", text: "Health checks, warranties, acceptance tests" },
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              className={design.feature + " group"}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.9 + i * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
            >
              <div className={design.icon}>{feature.icon}</div>
              <div className={design.featureTitle}>{feature.title}</div>
              <div className={design.featureText}>{feature.text}</div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className={design.icpBox}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 1.3 }}
        >
          <h3 className={design.icpTitle}>Ideal Client Profile</h3>
          <p className={design.icpText}>
            AI agencies selling text automation, document intelligence, RAG/knowledge systems, or agentic workflows that need a senior-level technical partner to architect, deliver, and support complex builds—without hiring full-time devs.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
