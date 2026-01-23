'use client';

import { ArrowLeft, Clock, Target, BookOpen, Zap, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function NowPage() {
  return (
    <div className="now-page">
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-logo">
            Aparna<span className="text-accent">.Dev</span>
          </Link>
          <Link href="/#contact" className="btn btn-primary btn-sm">
            Let&apos;s Talk
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <div className="container" style={{ maxWidth: '800px' }}>
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            Back to Projects
          </Link>

          <header className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={24} strokeWidth={2} className="text-accent" />
              <span className="text-tertiary text-sm uppercase tracking-wider">January 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              What I&apos;m Working On
            </h1>
            <p className="text-xl text-secondary" style={{ maxWidth: '600px' }}>
              A snapshot of my current projects, learning, and job search status.
            </p>
          </header>

          {/* Building */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Zap size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">Building</h2>
            </div>
            <div className="space-y-4">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge badge-success">Active</span>
                  <h3 className="font-semibold text-primary">SupplyGuard</h3>
                </div>
                <p className="text-secondary text-sm mb-3">
                  Onboarding the first beta customer. Refining the multi-agent workflow based on real-world logistics scenarios.
                </p>
                <p className="text-tertiary text-xs">
                  Last updated: January 2026
                </p>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="badge badge-warning">In Progress</span>
                  <h3 className="font-semibold text-primary">Research Agent</h3>
                </div>
                <p className="text-secondary text-sm mb-3">
                  Shipping this month. 3-agent orchestration (Researcher, Analyzer, Writer) for document Q&A with 10k+ token context.
                </p>
                <p className="text-tertiary text-xs">
                  Target: End of January 2026
                </p>
              </div>
            </div>
          </section>

          {/* Learning */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">Learning</h2>
            </div>
            <div className="card p-6">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Target size={18} strokeWidth={2} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-primary">Advanced LangGraph Patterns</h4>
                    <p className="text-secondary text-sm">Parallel execution, state checkpointing, and error recovery strategies for production agents.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Target size={18} strokeWidth={2} className="text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-primary">The Mom Test</h4>
                    <p className="text-secondary text-sm">Customer development and validated learning. Understanding real user needs vs. what they say they want.</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* Reading */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">Reading</h2>
            </div>
            <div className="card p-6">
              <div className="flex items-start gap-3">
                <BookOpen size={18} strokeWidth={2} className="text-tertiary mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-primary">The Mom Test</h4>
                  <p className="text-secondary text-sm">Rob Fitzpatrick - Customer development for entrepreneurs.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Job Search Status */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Calendar size={24} strokeWidth={2} className="text-accent" />
              <h2 className="text-2xl font-bold text-primary">Job Search Status</h2>
            </div>
            <div className="card p-6 bg-success-dim border-success">
              <div className="flex items-center gap-3 mb-4">
                <span className="badge badge-success">Actively Interviewing</span>
              </div>
              <p className="text-secondary text-sm mb-4">
                I&apos;m actively applying for and interviewing for <strong className="text-primary">Applied AI Engineer</strong> and <strong className="text-primary">AI Infrastructure</strong> roles.
              </p>
              <p className="text-secondary text-sm mb-2">
                <strong className="text-primary">Looking for:</strong> Remote-first companies building agentic AI systems
              </p>
              <p className="text-secondary text-sm">
                <strong className="text-primary">Next availability:</strong> February 2026 (flexible for the right opportunity)
              </p>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="card p-8 text-center bg-accent-dim border-accent">
            <h3 className="text-xl font-bold text-primary mb-3">Working on something interesting?</h3>
            <p className="text-secondary mb-6">
              Let&apos;s chat about how I can bring my AI agent expertise to your team.
            </p>
            <a href="mailto:ap3617180@gmail.com" className="btn btn-primary btn-lg">
              Let&apos;s Talk
            </a>
          </section>
        </div>
      </main>

      <style jsx>{`
        .now-page { min-height: 100vh; background: var(--color-bg-primary); }
        .pt-24 { padding-top: 6rem; }
        .pb-20 { padding-bottom: 5rem; }
      `}</style>
    </div>
  );
}
