"use client"

const STEPS = [
  {
    week: "Week 0",
    title: "Free AI Audit",
    description:
      "Your client completes a 10-minute assessment. I identify top 3 automation opportunities with ROI estimates.",
    deliverable: "Audit report with implementation costs",
    duration: "10 minutes",
    icon: "📊",
  },
  {
    week: "Week 1",
    title: "Kickoff & Foundation",
    description:
      "We review scope, set up infrastructure, and build core workflow. You stay in the loop with weekly demos.",
    deliverable: "Working prototype in staging",
    duration: "5-7 days",
    icon: "🚀",
  },
  {
    week: "Week 2-3",
    title: "HITL & Resilience",
    description: "Add approval gates, exception handling, and admin control panel. Your client tests in staging.",
    deliverable: "Full system ready for production",
    duration: "7-14 days",
    icon: "🛠️",
  },
  {
    week: "Week 4",
    title: "Launch & Handoff",
    description: "Deploy to production, train your team, transfer GitHub repo. You own all code and documentation.",
    deliverable: "Production system + full ownership",
    duration: "3-5 days",
    icon: "✅",
  },
]

export default function Process() {
  return (
    <section className="relative bg-black py-20 px-6 md:py-32">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">From Audit to Launch in 2-6 Weeks</h2>
        <p className="mt-4 text-neutral-300">Clear process, predictable timeline, no surprises.</p>

        <ol className="mt-10 relative">
          <div
            className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-[2px] bg-neutral-800"
            aria-hidden
          />
          <div className="space-y-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative grid md:grid-cols-2 gap-6">
                <div className="md:text-right">
                  <div className="inline-flex items-center gap-2 text-sm text-neutral-400">
                    <span className="text-lg" aria-hidden>
                      {s.icon}
                    </span>
                    <span className="font-mono">{s.week}</span>
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold">{s.title}</h3>
                </div>
                <div>
                  <p className="text-neutral-300">{s.description}</p>
                  <div className="mt-3 text-sm text-neutral-400">
                    <span className="mr-4">Deliverable: {s.deliverable}</span>
                    <span>Duration: {s.duration}</span>
                  </div>
                </div>
              </li>
            ))}
          </div>
        </ol>
      </div>
    </section>
  )
}
