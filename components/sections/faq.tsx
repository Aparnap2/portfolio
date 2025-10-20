import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    q: "How do you typically engage?",
    a: "Fixed-scope sprints or part-time retainers. Clear milestones, weekly demos, async first.",
  },
  {
    q: "What tech stack do you use?",
    a: "TypeScript, Next.js, Vercel AI SDK, Postgres/Neon, Supabase, and best-in-class LLM providers.",
  },
  {
    q: "Do you handle evaluation and safety?",
    a: "Yes. I implement evals, guardrails, logging, and observability to cut regressions and failure cases.",
  },
  {
    q: "Can you work with our team?",
    a: "Absolutely. I collaborate with PMs and engineers to ship outcomes without adding process overhead.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="border-b bg-background">
      <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 lg:py-20">
        <header className="mb-6">
          <h2 id="faq-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            {"FAQs"}
          </h2>
        </header>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, idx) => (
            <AccordionItem key={f.q} value={`item-${idx + 1}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
