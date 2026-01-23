'use client';

import { Play, ArrowRight, MapPin, Briefcase } from 'lucide-react';
import Link from 'next/link';

const techStack = [
  'LangGraph', 'Django', 'FastAPI', 'Modal', 'PostgreSQL', 'PydanticAI', 'Docling'
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg-effect">
        <div className="hero-bg-grid" />
        <div className="hero-bg-pattern" />
      </div>

      <div className="hero-content">
        <div className="hero-layout hero-simple">
          {/* Value Prop - No Photo */}
          <div className="hero-text">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Open to Work
            </div>

            <h1 className="hero-title">
              Aparna Pradhan
            </h1>

            <h2 className="hero-subtitle">
              Applied AI Engineer
            </h2>

            <p className="hero-description">
              I build AI agents that automate complex business workflows—turning expensive manual processes into autonomous systems.
            </p>

            {/* CTA Buttons */}
            <div className="hero-actions">
              <a
                href="https://youtube.com/watch?v=demo"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg btn-video"
              >
                <Play size={18} strokeWidth={2} />
                Watch 30-sec Demo
              </a>
              <a href="#projects" className="btn btn-secondary btn-lg">
                View Projects
                <ArrowRight size={18} strokeWidth={2} />
              </a>
            </div>

            {/* Featured Projects */}
            <div className="hero-projects">
              <span className="hero-projects-label">Built:</span>
              <a href="#supplyguard" className="hero-project-tag">SupplyGuard</a>
              <a href="#quote-parser" className="hero-project-tag">Quote Parser</a>
              <a href="#research-agent" className="hero-project-tag">Research Agent</a>
            </div>

            {/* Tech Stack */}
            <div className="hero-tech">
              <span className="hero-tech-label">Tech:</span>
              <div className="hero-tech-list">
                {techStack.map((tech) => (
                  <span key={tech} className="hero-tech-item">{tech}</span>
                ))}
              </div>
            </div>

            {/* Location & Availability */}
            <div className="hero-meta">
              <div className="hero-meta-item">
                <MapPin size={14} strokeWidth={2} />
                <span>Remote (India)</span>
              </div>
              <div className="hero-meta-divider" />
              <div className="hero-meta-item">
                <Briefcase size={14} strokeWidth={2} />
                <span>Open to: Applied AI Engineer, AI Infrastructure roles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
