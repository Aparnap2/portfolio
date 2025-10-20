"use client"

import Image from "next/image"
import { useState } from "react"

type Study = {
  id: string
  title: string
  client: string
  challenge: string
  solution: string
  image: string
  metrics: Array<
    | { label: string; before: string; after: string; improvement: string }
    | { label: string; value: string; roi: string }
  >
  quote: string
  author: string
  tags: string[]
  expandedContent: {
    techStack: string[]
    timeline: string
    workflow: string
  }
}

const CASES: Study[] = [
  {
    id: "hubspot-ops",
    title: "Internal Ops Orchestrator for B2B SaaS",
    client: "B2B SaaS (50-100 employees)",
    challenge: "10-day onboarding cycle with 15% error rate",
    solution: "Event-driven orchestrator with AGUI control panel",
    image: "/hubspot-ops-preview.jpg",
    metrics: [
      { label: "Cycle time", before: "10 days", after: "2 days", improvement: "80% faster" },
      { label: "Error rate", before: "15%", after: "<2%", improvement: "87% reduction" },
      { label: "Monthly savings", value: "$5,760", roi: "450% annual ROI" },
    ],
    quote: "We went from drowning in manual work to having a system that just works.",
    author: "VP Operations",
    tags: ["LangGraph", "HubSpot", "Airtable", "AGUI"],
    expandedContent: {
      techStack: ["Next.js", "LangGraph.js", "CopilotKit", "Upstash Redis", "Neon Postgres"],
      timeline: "4 weeks from kickoff to production",
      workflow:
        "Deal closed → validate → create Airtable + Drive folder → sync QuickBooks → schedule kickoff → nightly reconciliation",
    },
  },
  {
    id: "lead-bot",
    title: "AI Lead Qualification Bot",
    client: "Real Estate Agency (5-person team)",
    challenge: "4-hour lead response time, manual qualification",
    solution: "Conversational AI bot with automated CRM routing",
    image: "/lead-bot-preview.jpg",
    metrics: [
      { label: "Response time", before: "4 hours", after: "<1 minute", improvement: "99% faster" },
      { label: "SDR time per lead", before: "15 min", after: "2 min", improvement: "87% saved" },
      { label: "Conversion rate", before: "12%", after: "18%", improvement: "+50%" },
    ],
    quote: "Our leads were going cold. Now the bot qualifies them instantly and books meetings automatically.",
    author: "Agency Founder",
    tags: ["LangGraph", "OpenAI", "HubSpot", "Calendly"],
    expandedContent: {
      techStack: ["Next.js", "LangGraph.js", "GPT-4", "HubSpot API", "Upstash Redis"],
      timeline: "2 weeks",
      workflow:
        "Lead form → AI chatbot qualifies → if qualified: Calendly booking + CRM tag → if unqualified: nurture sequence",
    },
  },
  {
    id: "shopify-fulfillment",
    title: "Shopify Order Fulfillment Automation",
    client: "E-commerce (20-person team)",
    challenge: "48-hour ship time with 8% fulfillment errors",
    solution: "Event-driven order orchestrator with exception handling",
    image: "/shopify-fulfillment-preview.jpg",
    metrics: [
      { label: "Ship time", before: "48 hours", after: "4 hours", improvement: "92% faster" },
      { label: "Error rate", before: "8%", after: "<1%", improvement: "88% reduction" },
      { label: "Support tickets", before: "120/month", after: "15/month", improvement: "-87%" },
    ],
    quote: "We went from manually checking orders all day to just handling exceptions. The system catches 99%.",
    author: "Operations Manager",
    tags: ["Shopify", "3PL API", "LangGraph", "Exception Queue"],
    expandedContent: {
      techStack: ["Cloudflare Workers", "LangGraph.js", "Shopify API", "Upstash Redis", "Neon Postgres"],
      timeline: "3 weeks",
      workflow:
        "Order placed → validate inventory → if low stock: approval gate → send to 3PL → retry 3x if fails → exception queue",
    },
  },
]

export default function CaseStudies() {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <section className="py-20 px-6 md:py-32 bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Real Results for Real Clients</h2>
        <p className="mt-4 text-neutral-300">Production systems delivering measurable ROI.</p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {CASES.map((c) => {
            const isOpen = openId === c.id
            return (
              <article key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                <Image
                  src={c.image || "/placeholder.svg"}
                  alt={`${c.title} preview`}
                  width={640}
                  height={360}
                  className="w-full h-auto"
                />
                <div className="p-6">
                  <h3 className="text-2xl font-semibold">{c.title}</h3>
                  <div className="mt-1 text-sm text-neutral-400">{c.client}</div>
                  <p className="mt-2 text-neutral-300">{c.challenge}</p>
                  <div className="mt-3 text-sm text-neutral-400">Solution: {c.solution}</div>

                  <ul className="mt-4 space-y-2 text-sm">
                    {c.metrics.map((m, i) => (
                      <li key={i} className="text-neutral-300">
                        {"value" in m ? (
                          <span>
                            {m.label}: {m.value} • {m.roi}
                          </span>
                        ) : (
                          <span>
                            {m.label}: {m.before} → {m.after} • {m.improvement}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="mt-4 text-purple-400 hover:text-purple-300 underline underline-offset-4"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : c.id)}
                  >
                    {isOpen ? "Hide details" : "View details"}
                  </button>

                  {isOpen && (
                    <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
                      <div>
                        <strong>Tech stack:</strong> {c.expandedContent.techStack.join(", ")}
                      </div>
                      <div className="mt-2">
                        <strong>Timeline:</strong> {c.expandedContent.timeline}
                      </div>
                      <div className="mt-2">
                        <strong>Workflow:</strong> {c.expandedContent.workflow}
                      </div>
                      <blockquote className="mt-3 italic text-neutral-400">
                        “{c.quote}” — {c.author}
                      </blockquote>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-400">
                        {c.tags.map((t) => (
                          <span key={t} className="px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
