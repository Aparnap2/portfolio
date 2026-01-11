import { motion } from 'framer-motion';
import { Shield, Clock, BarChart3, Code, Database, Cpu, Zap, Target } from 'lucide-react';

const principles = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Proactive",
    description: "Agents act without prompts. They monitor, reason, and execute based on triggers and schedules.",
    accentColor: '#6366f1'
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: "Context-Aware",
    description: "Agents reason over history, state, and relationships—not just the current prompt.",
    accentColor: '#10b981'
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Agentic",
    description: "Plan → Decide → Execute → Learn. Agents own workflows end-to-end.",
    accentColor: '#a855f7'
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Safe",
    description: "Human-in-the-loop gates for risk. Autonomy has boundaries.",
    accentColor: '#06b6d4'
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: "Auditable",
    description: "Every decision explainable. Full trace from action to outcome.",
    accentColor: '#f59e0b'
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Production-Grade",
    description: "LangGraph state machines, typed agents, observability, and cost controls built-in.",
    accentColor: '#ef4444'
  },
];

const Philosophy = () => {
  return (
    <div className="philosophy-section" id="philosophy">
      <div className="section-header philosophy-header">
        <h2 className="section-title">How I&apos;m Different</h2>
        <p className="section-subtitle">Most AI projects are chat interfaces. My systems are autonomous agents that own real work.</p>
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
          <h3 className="philosophy-cta-title">Core Architecture Patterns</h3>
          <p className="philosophy-cta-text">LangGraph state machines, PostgreSQL + pgvector, Redis queues, Neo4j knowledge graphs, Pydantic-AI, and production observability.</p>
        </div>
        <a href="#contact" className="btn btn-primary btn-lg">
          Discuss a Contract
        </a>
      </div>
    </div>
  );
};

export default Philosophy;
