'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export default function CollapsibleSection({
  id,
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      id={id}
      className={`collapsible-section ${className}`}
      open={isOpen}
      onToggle={(e) => setIsOpen(e.target.open)}
    >
      <summary className="collapsible-header">
        <div className="collapsible-title">
          {icon && (
            <span className="collapsible-icon">
              {icon}
            </span>
          )}
          <div>
            <h3 className="collapsible-heading">{title}</h3>
            {subtitle && <p className="collapsible-subtitle">{subtitle}</p>}
          </div>
        </div>
        <ChevronRight
          className={`collapsible-indicator ${isOpen ? 'open' : ''}`}
          size={20}
          strokeWidth={2}
        />
      </summary>

      <div className="collapsible-content">
        {children}
      </div>
    </details>
  );
}
