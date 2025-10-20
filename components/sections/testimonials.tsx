import { Card, CardContent, CardHeader } from "@/components/ui/card"

const testimonials = [
  {
    quote: "Aparna was the technical force we needed to turn ambiguous AI ideas into reliable product features.",
    author: "Head of Product, B2B SaaS",
  },
  {
    quote: "She set up evals and guardrails that cut failure cases dramatically. Our release was on time and stable.",
    author: "Founder, AI Tools Startup",
  },
  {
    quote: "The best partner we’ve had for getting AI from prototype to production.",
    author: "CTO, Growth Stage Company",
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" aria-labelledby="testimonials-heading" className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 lg:py-20">
        <header className="mb-8 flex flex-col gap-2">
          <h2 id="testimonials-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            {"What partners say"}
          </h2>
          <p className="text-pretty text-muted-foreground">
            {"Outcomes-first collaboration with teams that care about quality."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.author} className="h-full">
              <CardHeader className="text-sm leading-relaxed">
                <blockquote className="text-pretty">“{t.quote}”</blockquote>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">— {t.author}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
