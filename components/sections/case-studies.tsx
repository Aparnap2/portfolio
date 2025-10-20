import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Case = {
  title: string
  impact: string
  summary: string
  metrics: string[]
}

const cases: Case[] = [
  {
    title: "Sales Assist Copilot",
    impact: "Increased qualified replies by 38%",
    summary: "Built retrieval-augmented email suggestions with tool-use and guardrails across 3 CRMs.",
    metrics: ["RAG", "Tools", "Safety"],
  },
  {
    title: "Support Triage Agent",
    impact: "Cut median resolution time by 42%",
    summary: "Automated intent detection and response drafting with human-in-the-loop approvals.",
    metrics: ["HITL", "Observability", "Evals"],
  },
  {
    title: "Docs Q&A Portal",
    impact: "Boosted self-serve resolution by 55%",
    summary: "Deployed a lightweight Q&A layer with chunking, embeddings, and inline citations.",
    metrics: ["Embeddings", "Rerank", "Citations"],
  },
]

export function CaseStudiesSection() {
  return (
    <section id="work" aria-labelledby="work-heading" className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 lg:py-20">
        <header className="mb-8 flex flex-col gap-2">
          <h2 id="work-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            {"Selected work"}
          </h2>
          <p className="text-pretty text-muted-foreground">{"A few recent engagements. Details available on call."}</p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {cases.map((c) => (
            <Card key={c.title} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <div className="text-sm text-primary">{c.impact}</div>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed">
                <p className="text-muted-foreground">{c.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.metrics.map((m) => (
                    <span key={m} className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
