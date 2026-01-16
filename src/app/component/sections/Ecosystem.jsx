import { motion } from 'framer-motion';
import { Box } from 'lucide-react';

const Ecosystem = () => {
  return (
    <div className="ecosystem-section" id="systems">
      <div className="section-header ecosystem-header">
        <h2 className="section-title">Systems</h2>
        <p className="section-subtitle">Production-ready agentic AI systems</p>
      </div>

      <div className="ecosystem-grid">
        <motion.div
          className="system-card"
        >
          <div className="system-card-header">
            <div
              className="system-icon"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}
            >
              <Box size={24} />
            </div>
            <div className="system-title-row">
              <h3 className="system-title">Production Systems</h3>
              <p className="system-subtitle">Agentic AI deployed in production</p>
            </div>
          </div>

          <p className="system-description">
            Three autonomous agentic AI systems designed to replace junior operational roles,
            handling finance ops, support triage, and production operations with human oversight.
          </p>

          <div className="system-card-footer">
            <span className="system-badge">3 Active Systems</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Ecosystem;
