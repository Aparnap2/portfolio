import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ServicesSection() {
  const services = [
    {
      title: "LLM Product Engineering",
      desc: "Design and implement end-to-end LLM features: prompts, retrieval, tool use, and safety guards.",
      icon: "/engineering-icon.jpg",
    },
    {
      title: "Data & Evaluation",
      desc: "Set up data pipelines, labeling workflows, and evals to improve quality and reduce regressions.",
      icon: "/data-pipeline-icon.jpg",
    },
    {
      title: "Infra & Reliability",
      desc: "Observability, rate-limits, caching, fallbacks, and cost controls tuned for AI workloads.",
      icon: "/infra-icon.jpg",
    },
  ]

  return (
    <section id="services" aria-labelledby="services-heading" className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 lg:py-20">
        <header className="mb-8 flex flex-col gap-2">
          <h2 id="services-heading" className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            {"What I do"}
          </h2>
          <p className="text-pretty text-muted-foreground">
            {"Partnering closely with founders and PMs to ship reliable AI experiences on real deadlines."}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.title} className="h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                  <Image alt={`${s.title} icon`} src={s.icon || "/placeholder.svg"} fill className="object-cover" />
                </div>
                <CardTitle className="text-base md:text-lg">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">{s.desc}</CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
