export default function SocialProof() {
  const stats = [
    { value: "80%", label: "Faster cycle times", description: "vs no-code tools" },
    { value: "$7.2K", label: "Average monthly savings", description: "for clients" },
    { value: "2-6", label: "Week delivery", description: "not months" },
    { value: "100%", label: "Code ownership", description: "no vendor lock-in" },
  ]
  return (
    <section className="relative bg-neutral-950">
      <div
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_bottom,transparent,rgba(255,255,255,0.02)),radial-gradient(60rem_60rem_at_50%_20%,rgba(255,255,255,0.04),transparent_60%)]"
        aria-hidden
      />
      <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center p-6 rounded-lg bg-gradient-to-b from-neutral-900/50 to-neutral-950/50 border border-neutral-800 hover:border-purple-800/50 transition-all">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="mt-3 text-base font-semibold text-white">{s.label}</div>
              <div className="text-sm text-neutral-400">{s.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
