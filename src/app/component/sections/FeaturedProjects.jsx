'use client';

import { ArrowRight, ExternalLink, Github, Zap, TrendingUp, Brain } from 'lucide-react';
import Link from 'next/link';

const featuredProjects = [
  {
    id: 'supplyguard',
    title: 'SupplyGuard',
    subtitle: 'Self-Healing Supply Chain AI',
    description: 'Multi-agent system that detects disruptions and auto-books backup carriers. Reduces rerouting time from 6+ hours to <2 minutes.',
    icon: TrendingUp,
    iconColor: '#00d9ff',
    metrics: ['40% faster decisions', '60% cost reduction', '<500ms latency'],
    tech: ['LangGraph', 'Django', 'Docling', 'NetworkX'],
    link: '/supplyguard',
    github: 'https://github.com/Aparnap2/supplyguard',
    status: 'production',
  },
  {
    id: 'quote-parser',
    title: 'Logistics Quote Parser',
    subtitle: 'OCR Document Processing',
    description: 'Extracts structured data from unstructured carrier PDFs. Achieves 95% accuracy with DeepSeek + Docling pipeline.',
    icon: Zap,
    iconColor: '#10b981',
    metrics: ['95% accuracy', '<500ms latency', 'Modal deployment'],
    tech: ['Docling', 'DeepSeek', 'PydanticAI', 'Modal'],
    link: '#',
    github: 'https://github.com/Aparnap2/docluflow_ai',
    status: 'production',
  },
  {
    id: 'research-agent',
    title: 'Research Agent',
    subtitle: 'Multi-Agent Q&A System',
    description: 'Orchestrates Researcher, Analyzer, and Writer agents for document Q&A. Handles 10k+ token contexts with semantic chunking.',
    icon: Brain,
    iconColor: '#f59e0b',
    metrics: ['10k+ context', '3-agent coordination', 'RAG pipeline'],
    tech: ['LangGraph', 'ChromaDB', 'OpenAI', 'RAG'],
    link: '#',
    github: 'https://github.com/Aparnap2',
    status: 'in-progress',
  },
];

export default function FeaturedProjects() {
  return (
    <div className="featured-projects">
      <div className="featured-grid">
        {featuredProjects.map((project) => (
          <article key={project.id} id={project.id} className="featured-card">
            <div className="featured-card-header">
              <div
                className="featured-icon"
                style={{ background: `${project.iconColor}20`, color: project.iconColor }}
              >
                <project.icon size={24} strokeWidth={2} />
              </div>
              <div className="featured-status">
                {project.status === 'production' ? (
                  <span className="badge badge-success">Production</span>
                ) : (
                  <span className="badge badge-warning">In Progress</span>
                )}
              </div>
            </div>

            <h3 className="featured-title">{project.title}</h3>
            <p className="featured-subtitle">{project.subtitle}</p>
            <p className="featured-description">{project.description}</p>

            <div className="featured-metrics">
              {project.metrics.map((metric, index) => (
                <span key={index} className="featured-metric">
                  {metric}
                </span>
              ))}
            </div>

            <div className="featured-tech">
              {project.tech.map((tech) => (
                <span key={tech} className="featured-tech-item">{tech}</span>
              ))}
            </div>

            <div className="featured-links">
              <Link href={project.link} className="featured-link featured-link-primary">
                View Details
                <ArrowRight size={14} strokeWidth={2} />
              </Link>
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="featured-link featured-link-secondary"
              >
                <Github size={14} strokeWidth={2} />
                Code
              </a>
            </div>
          </article>
        ))}
      </div>

      <style jsx>{`
        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .featured-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .featured-grid {
            grid-template-columns: 1fr;
          }
        }

        .featured-card {
          background: var(--color-bg-card);
          border: 1px solid var(--color-border-subtle);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          transition: all var(--transition-base);
        }

        .featured-card:hover {
          border-color: var(--color-border-default);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .featured-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .featured-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .featured-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 0.25rem;
        }

        .featured-subtitle {
          font-size: 0.875rem;
          color: var(--color-accent);
          margin: 0 0 0.75rem;
        }

        .featured-description {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin: 0 0 1rem;
          flex: 1;
        }

        .featured-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .featured-metric {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-success);
          background: var(--color-success-dim);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .featured-tech {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .featured-tech-item {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          background: var(--color-bg-elevated);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-subtle);
        }

        .featured-links {
          display: flex;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border-subtle);
        }

        .featured-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          text-decoration: none;
          border-radius: var(--radius-md);
          padding: 0.5rem 0.75rem;
          transition: all var(--transition-fast);
        }

        .featured-link-primary {
          background: var(--color-accent);
          color: white;
        }

        .featured-link-primary:hover {
          background: var(--color-accent-hover);
        }

        .featured-link-secondary {
          background: var(--color-bg-elevated);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-subtle);
        }

        .featured-link-secondary:hover {
          border-color: var(--color-border-default);
          color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
}
