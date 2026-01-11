import { motion } from 'framer-motion';
import { DollarSign, Headphones, Server, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const systems = [
  {
    id: 'invoicify',
    icon: <DollarSign className="w-6 h-6" />,
    accentColor: '#10b981',
    title: 'Invoicify',
    subtitle: 'Finance Ops AI Intern',
    description: 'Autonomous invoice processing, risk-aware approvals, payment scheduling, and runway-sensitive decisions.',
    capabilities: ['Accounts payable & receivable', 'Invoice reasoning & anomaly detection', 'Vendor risk profiling'],
  },
  {
    id: 'supportops-ai',
    icon: <Headphones className="w-6 h-6" />,
    accentColor: '#a855f7',
    title: 'SupportOps AI',
    subtitle: 'Support Triage Intern',
    description: 'Safe auto-reply, escalation logic, bug clustering, churn-risk detection, and internal task generation.',
    capabilities: ['Proactive ticket triage', 'Safe auto-resolution', 'Escalation logic'],
  },
  {
    id: 'devops-agent',
    icon: <Server className="w-6 h-6" />,
    accentColor: '#06b6d4',
    title: 'DevOps/SRE Agent',
    subtitle: 'Production Operations Intern',
    description: 'Proactive anomaly detection, root-cause reasoning, and supervised remediation for production systems.',
    capabilities: ['Context-aware monitoring', 'Incident diagnosis', 'Supervised auto-remediation'],
  },
];

const Ecosystem = () => {
  return (
    <div className="ecosystem-section" id="systems">
      <div className="section-header ecosystem-header">
        <h2 className="section-title">Selected Systems</h2>
        <p className="section-subtitle">Three agentic AI systems designed to replace junior operational roles</p>
      </div>

      <div className="ecosystem-grid">
        {systems.map((system, index) => (
          <motion.div
            key={system.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="system-card"
          >
            <div className="system-card-header">
              <div
                className="system-icon"
                style={{
                  background: `${system.accentColor}15`,
                  color: system.accentColor,
                }}
              >
                {system.icon}
              </div>
              <div className="system-title-row">
                <h3 className="system-title">{system.title}</h3>
                <p className="system-subtitle">{system.subtitle}</p>
              </div>
            </div>

            <p className="system-description">{system.description}</p>

            <div className="system-capabilities">
              {system.capabilities.map((cap, i) => (
                <div key={i} className="system-capability">
                  <CheckCircle size={14} style={{ color: system.accentColor }} />
                  <span>{cap}</span>
                </div>
              ))}
            </div>

            <div className="system-card-footer">
              <Link href={`/projects/${system.id}`} className="system-cta">
                View Case Study
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function CheckCircle({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export default Ecosystem;
