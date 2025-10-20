"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

const TIERS = [
  {
    id: "basic",
    name: "Basic Automation",
    price: "$500",
    delivery: "2 weeks",
    badge: null as string | null,
    description: "Perfect for solo founders validating with first clients",
    features: [
      "1 automated workflow (3-5 nodes)",
      "2 API integrations",
      "Event-driven architecture",
      "Basic monitoring",
      "1 week post-launch support",
      "Full code ownership",
    ],
    gradient: "from-blue-900/20 to-transparent",
    highlight: false,
  },
  {
    id: "professional",
    name: "Agentic Workflow + Control Panel",
    price: "$1,000",
    delivery: "3-4 weeks",
    badge: "Most Popular",
    description: "For growing agencies with 5-15 clients",
    features: [
      "Multi-step workflow (6-10 nodes)",
      "3 API integrations",
      "Admin Control Panel (AGUI)",
      "HITL approval gates",
      "Exception handling",
      "2 weeks support",
      "🎁 Bonus: Reconciliation job",
      "🎁 Bonus: Slack notifications",
      "🎁 Bonus: KPI dashboard",
    ],
    gradient: "from-purple-900/20 to-transparent",
    highlight: true,
  },
  {
    id: "premium",
    name: "Full Operations Orchestrator",
    price: "$2,000",
    delivery: "5-6 weeks",
    badge: null as string | null,
    description: "For scaling agencies (15+ clients)",
    features: [
      "2-3 connected workflows",
      "4-5 API integrations",
      "Full AGUI with advanced features",
      "Reconciliation engine",
      "1 month support",
      "🎁 Bonus: Temporal lineage",
      "🎁 Bonus: Advanced observability",
      "🎁 Bonus: Slack + email alerts",
      "🎁 Bonus: Cost optimization pack",
      "🎁 Bonus: Full handoff package",
    ],
    gradient: "from-green-900/20 to-transparent",
    highlight: false,
  },
]

const RevenueShare = {
  title: "Revenue Share Option",
  description: "No upfront cost—partner on 25-35% revenue share",
  bestFor: "Agencies with deal flow but tight budgets",
  terms: [
    "Pilot: 35% for first 3 projects",
    "Ongoing: 30% standard",
    "Minimum: $1,000 client project fee",
    "Payment: Within 7 days of client payment",
  ],
}

export default function Pricing() {
  return (
    <section className="py-20 px-6 md:py-32 bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
        <p className="mt-4 text-neutral-300">Fixed pricing or revenue share—your choice.</p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative rounded-2xl border border-neutral-800 bg-neutral-950 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                t.highlight ? "ring-2 ring-purple-500/40" : ""
              }`}
            >
              <div
                className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${t.gradient}`}
                aria-hidden
              />
              <div className="relative">
                {t.badge && (
                  <span className="inline-block text-xs px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {t.badge}
                  </span>
                )}
                <h3 className="mt-2 text-2xl font-semibold">{t.name}</h3>
                <div className="mt-2 text-4xl font-bold">{t.price}</div>
                <div className="text-sm text-neutral-400">Delivery: {t.delivery}</div>
                <p className="mt-3 text-neutral-300">{t.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-neutral-300">
                  {t.features.map((f) => (
                    <li key={f}>
                      <span className={f.includes("🎁") ? "text-green-400" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Button asChild className="w-full">
                    <Link href={`/contact?tier=${t.id}`}>
                      {t.highlight ? "Get Professional" : `Start with ${t.name.split(" ")[0]}`}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 relative">
          <div
            className="absolute inset-0 rounded-2xl ring-1 ring-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.2)]"
            aria-hidden
          />
          <div className="relative">
            <h3 className="text-2xl font-semibold">{RevenueShare.title}</h3>
            <p className="mt-2 text-neutral-300">{RevenueShare.description}</p>
            <div className="mt-2 text-sm text-neutral-400">Best for: {RevenueShare.bestFor}</div>
            <ul className="mt-4 grid md:grid-cols-2 gap-2 text-neutral-300">
              {RevenueShare.terms.map((t) => (
                <li key={t} className="rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
