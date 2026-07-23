'use client';

import { motion } from 'framer-motion';
import { Shield, Clock, BarChart3, Code, Database, Cpu, Zap, Target, Globe, GitMerge, Server, Layers } from 'lucide-react';

const principles = [
  {
    icon: <GitMerge className="w-5 h-5" />,
    title: "Integration-First",
    description: "I connect AI capabilities to existing systems — APIs, data pipelines, and legacy infrastructure. The model is only useful if it fits the production environment.",
    accentColor: '#6366f1'
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Deployment Thinking",
    description: "I design for production from day one: monitoring, edge cases, data sync, and graceful degradation. Staging success means nothing if it fails in the real environment.",
    accentColor: '#10b981'
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Customer Problem Solving",
    description: "I translate business pain into technical solutions and explain trade-offs to non-technical stakeholders. FDE is boundary work between engineering and business needs.",
    accentColor: '#a855f7'
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Production AI Systems",
    description: "RAG, fine-tuned models, MCP servers, and multi-agent workflows. I build systems that take real actions, not just chat interfaces.",
    accentColor: '#06b6d4'
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: "Documentation & Handoff",
    description: "Architecture diagrams, deployment guides, and troubleshooting notes. Clear documentation is a force multiplier for engineering teams.",
    accentColor: '#f59e0b'
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Measurable Business Outcomes",
    description: "I optimize for throughput, accuracy, and cost. Every system ships with eval metrics, error modes, and a story about the improvement it delivers.",
    accentColor: '#ef4444'
  },
];

const Philosophy = () => {
  return (
    <div className="philosophy-section" id="philosophy">
      <div className="section-header philosophy-header">
        <div className="section-overline">Operating Principles</div>
        <h2 className="section-title">How I Work</h2>
        <p className="section-subtitle">Forward deployed engineering: integration, deployment, and production AI systems that deliver measurable business outcomes.</p>
      </div>

      <div className="philosophy-grid">
        {principles.map((principle, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="principle-card"
          >
            <div className="principle-card-header">
              <div
                className="principle-icon"
                style={{
                  background: `${principle.accentColor}15`,
                  borderColor: `${principle.accentColor}30`,
                  color: principle.accentColor,
                }}
              >
                {principle.icon}
              </div>
              <h3 className="principle-title">{principle.title}</h3>
            </div>

            <p className="principle-description">{principle.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="philosophy-cta">
        <div className="philosophy-cta-content">
          <h3 className="philosophy-cta-title">Delivery Stack</h3>
          <p className="philosophy-cta-text">LangGraph · FastAPI · Go (Fiber, gRPC) · PostgreSQL + pgvector · Redis · Qdrant · Docker · Langfuse · TDD-first workflow</p>
        </div>
        <a href="#contact" className="btn btn-primary btn-lg">
          Let&apos;s Connect
        </a>
      </div>
    </div>
  );
};

export default Philosophy;
