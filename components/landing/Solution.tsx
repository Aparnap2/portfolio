import Image from "next/image"

const FEATURES = [
  {
    title: "Event-Driven LangGraph Workflows",
    description:
      "Multi-step automations with pause/resume, HITL approval gates, and exception handling. Built to scale from day one.",
    icon: "🔀",
    image: "/langgraph-workflow-diagram.jpg",
    techStack: ["LangGraph.js", "Redis Checkpoints", "Inngest"],
    code: `const workflow = new StateGraph();
workflow.addNode("validate", validateDeal);
workflow.addNode("approval", waitForApproval);
workflow.addNode("create_artifacts", createOnboardingArtifacts);`,
  },
  {
    title: "Admin Control Panels (AGUI)",
    description:
      "Give your clients visibility and control. See what's running, what's stuck, approve actions, fix exceptions with one click.",
    icon: "🎛️",
    image: "/admin-control-panel-screenshot.jpg",
    features: [
      "Live runs table with filters",
      "Approval queue with justification tracking",
      "Exception queue with diff preview",
      "KPI dashboard (cycle time, SLA, error rate)",
    ],
  },
  {
    title: "Custom API Integrations",
    description:
      "Connect to any system your client uses. HubSpot, Airtable, QuickBooks, Google Workspace, Slack—all with proper error handling and retries.",
    icon: "🔌",
    image: "/integrations-logos-grid.jpg",
    integrations: ["HubSpot", "Airtable", "QuickBooks", "Google", "Slack"],
  },
  {
    title: "Cost-Efficient Infrastructure",
    description:
      "Serverless architecture that scales automatically. $10-50/month for systems handling 100K+ events vs $400-800/month Zapier bills.",
    icon: "💰",
    image: "/cost-comparison-chart.jpg",
    comparison: {
      noCode: { cost: "$400-800/month", scale: "1K-10K tasks", reliability: "Breaks often" },
      custom: { cost: "$10-50/month", scale: "100K+ events", reliability: "Production-grade" },
    },
  },
]

export default function Solution() {
  return (
    <section className="relative py-20 px-6 md:py-32 bg-neutral-950">
      <div
        className="absolute inset-0 [background:repeating-linear-gradient(0deg,transparent,transparent_30px,rgba(255,255,255,0.03)_31px)]"
        aria-hidden
      />
      <div className="relative max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Your Technical Execution Partner</h2>
        <p className="mt-4 text-neutral-300">I handle the code. You keep the client relationship.</p>

        <div className="mt-10 space-y-16">
          {FEATURES.map((f, idx) => (
            <div key={f.title} className={`grid md:grid-cols-2 gap-8 items-center`}>
              <div className={`${idx % 2 === 0 ? "" : "md:order-2"}`}>
                <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950">
                  <Image
                    src={f.image || "/placeholder.svg"}
                    alt={`${f.title} illustration`}
                    width={800}
                    height={480}
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className={`${idx % 2 === 0 ? "" : "md:order-1"}`}>
                <div className="text-2xl" aria-hidden>
                  {f.icon}
                </div>
                <h3 className="mt-3 text-2xl md:text-3xl font-semibold">{f.title}</h3>
                <p className="mt-3 text-neutral-300">{f.description}</p>

                {"techStack" in f && f.techStack && (
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-400">
                    {f.techStack.map((t) => (
                      <span key={t} className="px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {"features" in f && f.features && (
                  <ul className="mt-4 list-disc list-inside text-neutral-300">
                    {f.features.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                )}

                {"integrations" in f && f.integrations && (
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-neutral-400">
                    {f.integrations.map((it) => (
                      <span key={it} className="px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800">
                        {it}
                      </span>
                    ))}
                  </div>
                )}

                {"code" in f && f.code && (
                  <pre className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-4 overflow-x-auto">
                    <code className="font-mono text-sm text-neutral-300 whitespace-pre">{f.code}</code>
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
