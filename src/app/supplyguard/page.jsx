'use client';

import { ArrowLeft, ExternalLink, Github, Play, Target, Zap, BarChart3, Clock, CheckCircle, TrendingUp, Code } from 'lucide-react';
import Link from 'next/link';

export default function SupplyGuardPage() {
  return (
    <div className="supplyguard-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-logo">
            Aparna<span className="text-accent">.Dev</span>
          </Link>
          <Link href="/#projects" className="btn btn-secondary btn-sm">
            Back to Projects
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <div className="container" style={{ maxWidth: '800px' }}>
          {/* Back Link */}
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            Back to Projects
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="badge badge-success">Production</span>
              <span className="text-tertiary text-sm">AI Agent System</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              SupplyGuard
            </h1>
            <p className="text-xl text-secondary mb-6">
              Self-Healing Supply Chain AI
            </p>
            <p className="text-lg text-secondary mb-8" style={{ maxWidth: '600px' }}>
              A multi-agent system that detects disruptions and auto-books backup carriers—reducing rerouting time from 6+ hours to under 2 minutes.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://youtube.com/watch?v=demo"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                <Play size={18} strokeWidth={2} />
                Watch Demo
              </a>
              <a
                href="https://github.com/Aparnap2/supplyguard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                <Github size={18} strokeWidth={2} />
                View Code
              </a>
            </div>
          </header>

          {/* Problem & Solution */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target size={24} strokeWidth={2} className="text-warning" />
                  <h2 className="text-xl font-semibold text-primary">Problem</h2>
                </div>
                <p className="text-secondary mb-4">
                  Supply chain disruptions cost businesses <strong>$4 trillion annually</strong>. Manual rerouting takes <strong>6+ hours</strong> per disruption, leading to delays, lost revenue, and customer dissatisfaction.
                </p>
                <p className="text-secondary">
                  Logistics managers spend hours calling carriers, comparing quotes, and coordinating bookings—time that could be spent on strategic tasks.
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap size={24} strokeWidth={2} className="text-accent" />
                  <h2 className="text-xl font-semibold text-primary">Solution</h2>
                </div>
                <p className="text-secondary mb-4">
                  An autonomous multi-agent system that monitors risks, computes alternative routes, and executes carrier bookings—with human approval gates for safety.
                </p>
                <p className="text-secondary">
                  Reduces disruption response time from <strong>6+ hours to &lt;2 minutes</strong> while maintaining human oversight for critical decisions.
                </p>
              </div>
            </div>
          </section>

          {/* Architecture */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">How It Works</h2>
            </div>

            <div className="card p-6">
              <div className="architecture-flow">
                <div className="architecture-step">
                  <div className="architecture-step-number">1</div>
                  <div className="architecture-step-content">
                    <h3 className="font-semibold text-primary">Risk Detection Agent</h3>
                    <p className="text-secondary text-sm">Monitors news, weather APIs, and port data to detect disruptions (e.g., Port Strike in LA)</p>
                  </div>
                </div>

                <div className="architecture-arrow">-&gt;</div>

                <div className="architecture-step">
                  <div className="architecture-step-number">2</div>
                  <div className="architecture-step-content">
                    <h3 className="font-semibold text-primary">Reroute Solver</h3>
                    <p className="text-secondary text-sm">Uses NetworkX to compute alternative routes and proposes Air Freight via Chicago</p>
                  </div>
                </div>

                <div className="architecture-arrow">-&gt;</div>

                <div className="architecture-step">
                  <div className="architecture-step-number">3</div>
                  <div className="architecture-step-content">
                    <h3 className="font-semibold text-primary">Logistics Agent</h3>
                    <p className="text-secondary text-sm">Reads carrier quotes using Docling OCR, selects best option based on urgency and cost</p>
                  </div>
                </div>

                <div className="architecture-arrow">-&gt;</div>

                <div className="architecture-step">
                  <div className="architecture-step-number">4</div>
                  <div className="architecture-step-content">
                    <h3 className="font-semibold text-primary">Human Approval Gate</h3>
                    <p className="text-secondary text-sm">User reviews proposal, approves, and agent executes booking automatically</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Code size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">Tech Stack</h2>
            </div>

            <div className="card p-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-tertiary uppercase tracking-wider mb-3">Backend</h3>
                  <ul className="space-y-2 text-secondary text-sm">
                    <li>- Django (REST API)</li>
                    <li>- LangGraph (orchestration)</li>
                    <li>- NetworkX (optimization)</li>
                    <li>- PostgreSQL (data)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-tertiary uppercase tracking-wider mb-3">AI/ML</h3>
                  <ul className="space-y-2 text-secondary text-sm">
                    <li>- PydanticAI (structured LLM)</li>
                    <li>- Docling (OCR)</li>
                    <li>- DeepSeek (inference)</li>
                    <li>- ChromaDB (vector store)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-tertiary uppercase tracking-wider mb-3">Infrastructure</h3>
                  <ul className="space-y-2 text-secondary text-sm">
                    <li>- Modal (serverless)</li>
                    <li>- Railway (hosting)</li>
                    <li>- Docker (containers)</li>
                    <li>- GitHub Actions (CI/CD)</li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t border-border-subtle">
                <h3 className="text-sm font-medium text-tertiary uppercase tracking-wider mb-3">Key Challenges Solved</h3>
                <ul className="space-y-2 text-secondary text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} strokeWidth={2} className="text-success mt-0.5 flex-shrink-0" />
                    <span>Reduced LLM latency from 8s to &lt;2s using caching + parallel execution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} strokeWidth={2} className="text-success mt-0.5 flex-shrink-0" />
                    <span>Achieved 95% OCR accuracy on real logistics PDFs with Docling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} strokeWidth={2} className="text-success mt-0.5 flex-shrink-0" />
                    <span>Handled 10k+ token contexts with semantic chunking strategies</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Results */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">Results & Impact</h2>
            </div>

            <div className="grid-3 gap-4 mb-8">
              <div className="card p-6 text-center">
                <div className="kpi-value">40%</div>
                <div className="kpi-improvement">faster decisions</div>
                <div className="text-tertiary text-xs mt-1">vs manual process</div>
              </div>
              <div className="card p-6 text-center">
                <div className="kpi-value">60%</div>
                <div className="kpi-improvement">cost reduction</div>
                <div className="text-tertiary text-xs mt-1">using DeepSeek vs GPT-4</div>
              </div>
              <div className="card p-6 text-center">
                <div className="kpi-value">&lt;500ms</div>
                <div className="kpi-improvement">API response</div>
                <div className="text-tertiary text-xs mt-1">average latency</div>
              </div>
            </div>

            <div className="card p-6 bg-success-dim border-success">
              <h3 className="font-semibold text-primary mb-3">Target Market</h3>
              <p className="text-secondary text-sm mb-3">
                Built for logistics managers at mid-size importers (50-200 employees). Use case: Companies with 20+ shipments/month facing frequent disruptions.
              </p>
              <p className="text-secondary text-sm">
                <strong>Status:</strong> Live demo available. Currently onboarding beta users.
              </p>
            </div>
          </section>

          {/* Code Sample */}
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Code size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">Code Sample</h2>
            </div>

            <div className="card overflow-hidden">
              <div className="bg-elevated px-4 py-2 border-b border-border-subtle">
                <span className="text-tertiary text-sm font-mono">lib/agents/logistics_execution.ts</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
{`def logistics_execution_node(state: AgentState):
    """Finds and processes carrier quotes after reroute approval."""
    parsed_quotes = []
    for pdf_file in state['quote_files']:
        data = parse_quote_pdf(pdf_file)  # Docling OCR
        parsed_quotes.append(data)

    # Decision logic based on urgency
    if state['risk_score'] > 80:
        selected = min(parsed_quotes, key=lambda x: x['eta'])
    else:
        selected = min(parsed_quotes, key=lambda x: x['price'])

    return {"final_booking": selected}`}
              </pre>
            </div>

            <div className="mt-4 text-center">
              <a
                href="https://github.com/Aparnap2/supplyguard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={16} strokeWidth={2} />
                View Full Implementation
              </a>
            </div>
          </section>

          {/* Hiring Context */}
          <section className="mb-16">
            <div className="card p-6 bg-accent-dim border-accent">
              <h3 className="font-semibold text-primary mb-3">How This Applies to Your Company</h3>
              <p className="text-secondary text-sm mb-4">
                The core architecture—multi-agent orchestration, OCR pipelines, and LLM integration—is domain-agnostic:
              </p>
              <ul className="space-y-2 text-secondary text-sm mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-accent">-</span>
                  <span><strong>Fintech AI:</strong> Document intelligence for deal books (same OCR pipeline)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">-</span>
                  <span><strong>Healthcare AI:</strong> Patient data extraction from medical records (same RAG architecture)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">-</span>
                  <span><strong>E-commerce AI:</strong> Inventory optimization agents (same multi-agent orchestration)</span>
                </li>
              </ul>
              <p className="text-secondary text-sm">
                I adapt the agents to your business logic and integrate with your existing systems.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center py-12 border-t border-border-subtle">
            <h2 className="text-2xl font-bold text-primary mb-4">Ready to build autonomous AI systems?</h2>
            <p className="text-secondary mb-6 max-w-md mx-auto">
              Let&apos;s discuss how I can bring this expertise to your team and solve your most complex workflow automation challenges.
            </p>
            <a href="mailto:ap3617180@gmail.com" className="btn btn-primary btn-lg">
              Let&apos;s Talk
            </a>
          </section>
        </div>
      </main>

      <style jsx>{`
        .supplyguard-page {
          min-height: 100vh;
          background: var(--color-bg-primary);
        }
        .pt-24 { padding-top: 6rem; }
        .pb-20 { padding-bottom: 5rem; }
        .mb-16 { margin-bottom: 4rem; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr; }
        }
        .architecture-flow {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .architecture-step {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }
        .architecture-step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }
        .architecture-step-content {
          flex: 1;
        }
        .architecture-arrow {
          color: var(--color-accent);
          font-size: 1.25rem;
          padding-left: 2.5rem;
        }
        @media (max-width: 640px) {
          .architecture-arrow { padding-left: 1rem; }
        }
      `}</style>
    </div>
  );
}
