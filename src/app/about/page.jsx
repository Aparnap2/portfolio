'use client';

import { ArrowLeft, MapPin, Mail, Linkedin, Github, ExternalLink, GraduationCap, Clock, Zap, Target } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="about-page">
      {/* Navigation */}
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
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              About Me
            </h1>
            <p className="text-xl text-secondary mb-8" style={{ maxWidth: '600px' }}>
              I&apos;m a self-taught AI engineer from West Bengal, India, building autonomous agents that solve real business problems.
            </p>
          </header>

          {/* No-Degree Story */}
          <section className="mb-16">
            <div className="card p-8 bg-gradient-to-br from-accent-dim/20 to-transparent border-accent">
              <div className="flex items-start gap-4 mb-6">
                <GraduationCap size={32} strokeWidth={2} className="text-accent flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-4">I don&apos;t have a CS degree. Here&apos;s what I have instead.</h2>
                  <div className="space-y-4 text-secondary">
                    <p>
                      <strong className="text-primary">500+ hours</strong> of hands-on learning, building production AI systems from scratch—not following tutorials, but debugging production bugs at 2am.
                    </p>
                    <p>
                      <strong className="text-primary">3 shipped projects</strong> solving real business problems: SupplyGuard (multi-agent logistics), OCR document parsing, and RAG-based research agents.
                    </p>
                    <p>
                      <strong className="text-primary">Stack mastery through shipping</strong>—not from courses, but from building, breaking, and fixing real systems that run in production.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Why I&apos;m Effective */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-primary mb-6">Why I&apos;m Effective</h2>
            <div className="grid gap-4">
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <Zap size={24} strokeWidth={2} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-2">I learn by doing</h3>
                    <p className="text-secondary text-sm">Shipped 3 production systems in 6 months. Each one taught me more than any course ever could.</p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <Target size={24} strokeWidth={2} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-2">I&apos;m scrappy</h3>
                    <p className="text-secondary text-sm">Solo developer with zero budget. I figure out how to build production-quality systems with minimal resources.</p>
                  </div>
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <Clock size={24} strokeWidth={2} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-2">I&apos;m relentless</h3>
                    <p className="text-secondary text-sm">Built SupplyGuard while teaching myself LangGraph. Learned PydanticAI by shipping it to production.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Mindset */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-primary mb-6">Product Thinking</h2>
            <div className="card p-6">
              <p className="text-secondary mb-4">
                I don&apos;t just write code. I build <strong className="text-primary">systems that solve expensive problems</strong>.
              </p>
              <p className="text-secondary mb-4">
                SupplyGuard exists because supply chain disruptions cost <strong className="text-primary">$4 trillion annually</strong>. The quote parser exists because manual data entry is expensive and error-prone.
              </p>
              <p className="text-secondary">
                Every project I build starts with a business problem, not a technology. The AI/ML is the tool, not the goal.
              </p>
            </div>
          </section>

          {/* What I&apos;m Looking For */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-primary mb-6">What I&apos;m Looking For</h2>
            <div className="card p-6">
              <p className="text-secondary mb-4">
                Remote-first AI startup where I can build agent systems that create <strong className="text-primary">measurable business impact</strong>.
              </p>
              <p className="text-secondary mb-4">
                I&apos;m inspired by companies like:
              </p>
              <ul className="space-y-2 text-secondary text-sm mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-accent">-</span>
                  Smallest AI (hiring without degrees)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">-</span>
                  YC startups (ship fast, iterate)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">-</span>
                  Modal/Railway (developers who scale infrastructure)
                </li>
              </ul>
              <p className="text-secondary">
                <strong className="text-primary">Role:</strong> Applied AI Engineer, AI Infrastructure Engineer, or ML Engineer
              </p>
            </div>
          </section>

          {/* Contact Info */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-primary mb-6">Let&apos;s Connect</h2>
            <div className="card p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="mailto:ap3617180@gmail.com"
                  className="flex items-center gap-3 p-4 bg-elevated rounded-lg hover:bg-hover transition-colors"
                >
                  <Mail size={20} strokeWidth={2} className="text-accent" />
                  <div>
                    <div className="text-xs text-tertiary uppercase tracking-wider">Email</div>
                    <div className="text-secondary">ap3617180@gmail.com</div>
                  </div>
                </a>
                <a
                  href="https://linkedin.com/in/aparnapradhan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-elevated rounded-lg hover:bg-hover transition-colors"
                >
                  <Linkedin size={20} strokeWidth={2} className="text-accent" />
                  <div>
                    <div className="text-xs text-tertiary uppercase tracking-wider">LinkedIn</div>
                    <div className="text-secondary">aparnapradhan</div>
                  </div>
                </a>
                <a
                  href="https://github.com/Aparnap2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-elevated rounded-lg hover:bg-hover transition-colors"
                >
                  <Github size={20} strokeWidth={2} className="text-accent" />
                  <div>
                    <div className="text-xs text-tertiary uppercase tracking-wider">GitHub</div>
                    <div className="text-secondary">Aparnap2</div>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-4 bg-elevated rounded-lg">
                  <MapPin size={20} strokeWidth={2} className="text-accent" />
                  <div>
                    <div className="text-xs text-tertiary uppercase tracking-wider">Location</div>
                    <div className="text-secondary">West Bengal, India (Remote)</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Response Time SLA */}
          <section className="card p-6 bg-success-dim border-success mb-12">
            <div className="flex items-center gap-3">
              <Clock size={20} strokeWidth={2} className="text-success" />
              <div>
                <h3 className="font-semibold text-primary">Response SLA</h3>
                <p className="text-secondary text-sm">I reply to emails within <strong className="text-success">24 hours</strong>.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .about-page {
          min-height: 100vh;
          background: var(--color-bg-primary);
        }
        .pt-24 { padding-top: 6rem; }
        .pb-20 { padding-bottom: 5rem; }
        .mb-16 { margin-bottom: 4rem; }
      `}</style>
    </div>
  );
}
