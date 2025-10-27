"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const services = [
  {
    title: "Lead Capture & Booking Automation",
    price: "$1,800 fixed + $250/mo",
    alternative: "50/50 revenue share → 60/40 after 3 projects",
    description: "24×7 stateful chat (IG DM/WhatsApp/SMS/web) → qualify → calendar booking → CRM sync → audit log.",
    stack: ["FastAPI", "LangGraph", "Google Calendar", "HubSpot", "Redis", "Postgres"],
    slas: ["<1s P95 reply", ">95% field capture", "Stateless option available"],
    color: "from-blue-600 to-cyan-600"
  },
  {
    title: "Temporal Knowledge Graph Support",
    price: "$4,500 fixed + $400/mo",
    alternative: "50/50 revenue share → 60/40 after 3 projects",
    description: "Document ingestion → temporal knowledge graph (time-scoped facts, provenance) → time-aware Q&A with citations.",
    stack: ["Docling", "PaddleOCR", "Neo4j", "FAISS", "LangGraph", "Groq 8B/20B"],
    slas: ["≥90% temporal correctness", "≥95% claim citation coverage", "Validator gates on dates"],
    color: "from-purple-600 to-pink-600"
  },
  {
    title: "Agentic UI Dashboard (AGUI)",
    price: "$7,500 fixed + $600/mo",
    alternative: "50/50 revenue share → 60/40 after 3 projects",
    description: "Unified panel for HubSpot/Gmail/Notion/Airtable/Calendar → natural-language CRUD → confirm-execute loop + automation triggers.",
    stack: ["FastAPI", "LangGraph", "RBAC", "Event Bus", "Audit Log"],
    slas: ["10 common intents end-to-end", "Rollback capability", "Dry-run previews"],
    color: "from-green-600 to-teal-600"
  },
  {
    title: "Custom Document Intelligence",
    price: "$3,000–$6,000 fixed + $350/mo",
    alternative: "20–25% of first-year client savings",
    description: "PDF/Word/Excel → structured JSON → validation → export/DB sync. Router: blank/dup detection → rules → OCR → Docling → small LLM snippets.",
    stack: ["PyMuPDF", "PaddleOCR", "Docling", "Groq Llama-3-8B", "Validators"],
    slas: ["98.5–99.2% field accuracy", "<10 hours/month unpaid support"],
    color: "from-orange-600 to-red-600"
  },
  {
    title: "Monthly Technical Retainer",
    price: "$5,500/month",
    alternative: "First month 50% off",
    description: "On-call CTO for agencies with 2–5 builds/month. You own sales/clients; we handle architecture, delivery, L2 support.",
    stack: ["Full Stack", " architecture", "delivery", "L2 support"],
    slas: ["80 hours/month", "90-day warranty", "Weekly sync"],
    color: "from-indigo-600 to-purple-600"
  }
]

const design = {
  section: "py-16 md:py-24 px-6 bg-black",
  container: "max-w-7xl mx-auto",
  header: "text-center mb-16",
  eyebrow: "uppercase tracking-widest text-neutral-400 text-xs md:text-sm mb-4",
  title: "text-4xl md:text-5xl font-bold bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-transparent mb-6",
  subtitle: "text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto",
  grid: "grid md:grid-cols-2 lg:grid-cols-3 gap-8",
  card: "relative bg-neutral-900/50 border border-neutral-800 rounded-lg p-8 overflow-hidden hover:border-neutral-700 transition-all duration-300",
  cardHeader: "flex flex-col md:flex-row md:items-center md:justify-between mb-6",
  badge: "absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full",
  title: "text-2xl font-bold text-white mb-4 md:mb-0",
  priceBox: "bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-800/50 rounded-lg p-4 mb-4",
  price: "text-xl font-bold text-white",
  alternative: "text-sm text-neutral-400 mt-2",
  description: "text-neutral-300 leading-relaxed mb-6",
  stackTitle: "text-sm font-medium text-neutral-400 mb-3",
  stack: "flex flex-wrap gap-2 mb-6",
  techBadge: "px-2 py-1 text-xs bg-neutral-800 text-neutral-300 border border-neutral-700 rounded",
  slas: "space-y-2",
  slaItem: "flex items-center gap-2 text-sm text-neutral-300",
  checkmark: "text-green-400",
  gradientSection: "absolute -inset-px bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-lg",
  pricingSection: "mt-16 text-center",
  pricingTitle: "text-3xl font-bold text-white mb-8",
  pricingGrid: "grid md:grid-cols-3 gap-6",
  pricingCard: "bg-neutral-900/50 border border-neutral-800 rounded-lg p-6",
  pricingCardTitle: "text-xl font-semibold text-white mb-4",
  pricingCardText: "text-neutral-300"
}

export default function Services() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="services" className={design.section} aria-label="Services section">
      <div className={design.container}>
        <div className={design.header}>
          <motion.p 
            className={design.eyebrow}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Services
          </motion.p>
          <motion.h2 
            className={design.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Production AI Systems for Agencies
          </motion.h2>
          <motion.p 
            className={design.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Code-first architecture, competitive pricing, SLA-backed delivery. Templates deploy in 7–14 days; custom builds in 2–4 weeks.
          </motion.p>
        </div>

        <div className={design.grid}>
          {services.map((service, index) => (
            <div key={index} className={`${design.card} group relative`}>
              <div className={`${design.gradientSection} bg-gradient-to-r ${service.color}`} />
              <div className={design.cardHeader}>
                <div className={design.title}>{service.title}</div>
                <Badge className="bg-green-900/50 text-green-300 border-green-800">
                  Available
                </Badge>
              </div>

              <div className={design.priceBox}>
                <div className={design.price}>{service.price}</div>
                <div className={design.alternative}>{service.alternative}</div>
              </div>

              <p className={design.description}>{service.description}</p>

              <div>
                <div className={design.stackTitle}>Tech Stack</div>
                <div className={design.stack}>
                  {service.stack.map((tech) => (
                    <span key={tech} className={design.techBadge}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className={design.stackTitle}>SLAs</div>
                <div className={design.slas}>
                  {service.slas.map((sla, i) => (
                    <div key={i} className={design.slaItem}>
                      <span className={design.checkmark}>✓</span>
                      {sla}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={design.pricingSection}>
          <h3 className={design.pricingTitle}>Pricing Philosophy</h3>
          <div className={design.pricingGrid}>
            <div className={design.pricingCard}>
              <h4 className={design.pricingCardTitle}>Fixed + Credits Hybrid</h4>
              <p className={design.pricingCardText}>
                Predictable build fee + prepaid credits for ops; optional outcome fees to align incentives.
              </p>
            </div>
            <div className={design.pricingCard}>
              <h4 className={design.pricingCardTitle}>Low Competitive Edge</h4>
              <p className={design.pricingCardText}>
                80–95% Groq 8B routing + Docling OSS = 30–50% below naive GPT-4 stacks while defending margin.
              </p>
            </div>
            <div className={design.pricingCard}>
              <h4 className={design.pricingCardTitle}>No Per-Page SaaS Tax</h4>
              <p className={design.pricingCardText}>
                Snippet prompting + semantic cache + batch discounts keep us profitable even at scale.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button
              asChild
              className="h-14 px-8 text-base font-medium shadow-[0_0_40px_rgba(168,85,247,0.35)] bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 relative"
            >
              <Link href="/audit">
                Book Free Strategy Call
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  3 spots left
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
