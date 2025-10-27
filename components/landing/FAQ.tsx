"use client"

import { useState } from "react"

const FAQS = [
  {
    q: "Can you handle stateless/process-and-delete for compliance?",
    a: "Yes. We store only fingerprints + extracted JSON + audit logs; no raw file bytes. Deletion proof logs available for compliance requirements.",
  },
  {
    q: "What's included in 'L2 support'?",
    a: "Code bugs, API errors, performance issues. L1 (content tweaks, template changes, how-to) stays with your team or billed separately at $75/hour.",
  },
  {
    q: "Do you work with n8n/Make agencies?",
    a: "Absolutely. We're the 'when you outgrow low-code' option. If your client needs custom logic, compliance, or scale that no-code can't handle, we step in.",
  },
  {
    q: "Can we white-label and resell your work?",
    a: "Yes. You own the client relationship; we never contact them directly. Code repos transfer to you on delivery (or we host on your accounts).",
  },
  {
    q: "What if we need a feature you haven't built before?",
    a: "Custom builds are quoted T&M (time & materials) at $100–125/hour, or we can estimate fixed-fee with a change-order policy if scope shifts.",
  },
  {
    q: "How do you justify your pricing versus GPT-4 stacks?",
    a: "We route 80–95% of calls to Groq 8B ($0.05/1M in, $0.08/1M out) and use Docling (MIT OSS) before touching LLMs. This lets us price 30–50% below agencies using naive GPT-4 stacks while defending margin.",
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="faq" className="py-16 md:py-24 px-6 bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Common Questions</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <button
                  type="button"
                  className="w-full text-left flex items-start justify-between gap-4"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-lg font-semibold">{f.q}</span>
                  <span aria-hidden className="text-neutral-400">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && <p className="mt-3 text-neutral-300">{f.a}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
