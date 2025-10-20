const CARDS = [
  {
    title: "No-Code Tools Break at Scale",
    description: "Zapier/Make bills hit $400-800/month. Systems break at 1,000 tasks. Clients outgrow your stack.",
    icon: "⚠️",
    stat: "$400-800/month",
    gradient: "from-red-900/20 to-transparent",
  },
  {
    title: "Unreliable Freelancers",
    description: "They ghost mid-project. Quality is inconsistent. No ongoing support after delivery.",
    icon: "👻",
    stat: "50% fail rate",
    gradient: "from-orange-900/20 to-transparent",
  },
  {
    title: "Expensive Dev Agencies",
    description: "3+ month timelines. $10K+ minimums. Over-engineered solutions you don't need.",
    icon: "⏰",
    stat: "3-6 months",
    gradient: "from-yellow-900/20 to-transparent",
  },
]

export default function ProblemStatement() {
  return (
    <section className="py-20 px-6 md:py-32 bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
          Built for agencies who sell AI but don&apos;t write code
        </h2>
        <p className="mt-4 text-neutral-300">
          {"You're great at landing clients. But when it's time to build, you're stuck."}
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {CARDS.map((c) => (
            <div
              key={c.title}
              className={`relative rounded-xl border border-neutral-800 bg-neutral-950 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
            >
              <div
                className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br ${c.gradient}`}
                aria-hidden
              />
              <div className="relative">
                <div className="text-2xl" aria-hidden>
                  {c.icon}
                </div>
                <h3 className="mt-3 text-2xl font-semibold">{c.title}</h3>
                <p className="mt-2 text-neutral-300">{c.description}</p>
                <div className="mt-4 inline-flex items-center text-sm text-neutral-400">
                  <span className="font-mono">{c.stat}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
