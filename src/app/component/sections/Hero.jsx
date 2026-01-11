'use client';

import Image from 'next/image';
import { ArrowRight, Cpu, Globe, Zap, CheckCircle } from 'lucide-react';
import me from '../../public/images/me.jpeg';

const highlights = [
  { icon: Cpu, text: 'LangGraph State Machines' },
  { icon: Globe, text: 'Production-Grade Systems' },
  { icon: Zap, text: 'Finance & Support Automation' },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg-effect">
        <div className="hero-bg-grid" />
        <div className="hero-bg-pattern" />
      </div>

      <div className="hero-content">
        <div className="hero-layout">
          <div className="hero-image-container">
            <div className="hero-image-wrapper">
              <Image
                src={me}
                alt="Aparna Pradhan - Agentic AI Systems Architect"
                fill
                className="hero-image"
                priority
              />
            </div>
            <div className="hero-image-accent" />
          </div>

          <div className="hero-text">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Available for Contracts & Advisory
            </div>

            <h1 className="hero-title">
              I Build Proactive Agentic AI Systems That{' '}
              <span className="hero-title-accent">Replace Operational Roles</span>
            </h1>

            <p className="hero-description">
              I design context-aware, production-grade AI agents that autonomously run finance ops, support triage, and DevOps workflows—with human-in-the-loop safety, auditability, and measurable business impact.
            </p>

            <p className="hero-description-sub">
              These systems don&apos;t just assist users. They own workflows end-to-end, reason over real-world context, and act reliably in production.
            </p>

            <div className="hero-actions">
              <a href="#systems" className="btn btn-primary btn-lg">
                View Case Studies
                <ArrowRight size={18} strokeWidth={2} />
              </a>
              <a href="#philosophy" className="btn btn-secondary btn-lg">
                See System Design
              </a>
            </div>

            <div className="hero-highlights">
              {highlights.map((item, index) => (
                <div key={index} className="hero-highlight-item">
                  <item.icon size={18} strokeWidth={2} />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
