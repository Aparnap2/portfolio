'use client';

import Image from 'next/image';
import { ArrowRight, Cpu, Globe, Zap, Target } from 'lucide-react';
import me from '../../public/images/me.jpeg';

const highlights = [
  { icon: Cpu, text: 'Agentic AI Systems' },
  { icon: Globe, text: 'Forward Deployed Engineering' },
  { icon: Zap, text: 'PRD-Driven Delivery' },
  { icon: Target, text: 'Business-First Architect' },
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
                alt="Aparna Pradhan - Applied AI Architect & Forward Deployed Engineer"
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
              Open to FDE / Applied AI / Staff+ AI Engineer Roles
            </div>

            <h1 className="hero-title">
              I build agentic AI systems that turn ambiguous business problems into governed workflows and measurable outcomes.
            </h1>

            <p className="hero-description">
              Builder of agentic AI and operations systems with deterministic automation, PRD-driven delivery, and CLI-agent-assisted coding workflow. Breaking problems into tasks, enforcing TDD, validating with Docker and curl.
            </p>

            <p className="hero-description-sub">
              Self-taught in FP&A and business analysis, bringing a strong business lens to internal tools, applied AI, and forward-deployed work.
            </p>

            <div className="hero-actions">
              <a href="#projects" className="btn btn-primary btn-lg">
                View Case Studies
                <ArrowRight size={18} strokeWidth={2} />
              </a>
              <a href="#skills" className="btn btn-secondary btn-lg">
                See Capabilities
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
