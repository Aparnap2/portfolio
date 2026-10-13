'use client';

import Image from 'next/image';
import { ArrowRight, Cpu, Globe, Zap, Target, Github } from 'lucide-react';
import me from '../../public/images/me.jpeg';

const highlights = [
  { icon: Cpu, text: 'Deterministic-first math' },
  { icon: Zap, text: 'Bounded agents + human review' },
  { icon: Target, text: 'Evidence-backed claims' },
  { icon: Globe, text: 'CI-gated delivery' },
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
                sizes="(max-width: 1024px) 60vw, 240px"
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
              I build AI systems that reason through ambiguity and execute within deterministic, auditable workflows.
            </h1>

            <p className="hero-description">
              Applied AI and forward-deployed engineering: from business-problem discovery
              through system design, agentic reasoning, deterministic validation,
              and human-approved actions.
            </p>

            <p className="hero-description-sub">
              Business-first — FP&amp;A and business-analysis foundations behind
              two flagship systems: FinSight and ClaimOps.
            </p>

            <div className="hero-actions">
              <a href="#flagship-finsight" className="btn btn-primary btn-lg">
                Explore FinSight
                <ArrowRight size={18} strokeWidth={2} />
              </a>
              <a href="#flagship-claimops" className="btn btn-secondary btn-lg">
                Explore ClaimOps
              </a>
              <a
                href="https://github.com/aparnap2"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-lg"
              >
                <Github size={18} strokeWidth={2} />
                GitHub
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
