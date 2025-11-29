import Card from './Card';

const ArchitectureDiagram = ({ className = '' }) => {
  return (
    <Card variant="glass" className={`p-8 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">System Architecture</h3>
        <p className="text-gray-400 text-sm">PDF Input → Queue → Worker → Validation → Database</p>
      </div>
      
      <div className="flex items-center justify-between space-x-4 overflow-x-auto">
        {[
          { label: 'PDF Input', icon: '📄', color: 'blue' },
          { label: 'Redis Queue', icon: '⚡', color: 'yellow' },
          { label: 'Celery Worker', icon: '⚙️', color: 'green' },
          { label: 'Pydantic', icon: '✅', color: 'purple' },
          { label: 'PostgreSQL', icon: '🗄️', color: 'blue' }
        ].map((step, index) => (
          <div key={index} className="flex flex-col items-center min-w-0 flex-1">
            <div className={`w-12 h-12 bg-${step.color}-600/20 border border-${step.color}-500/30 rounded-full flex items-center justify-center mb-2`}>
              <span className="text-lg">{step.icon}</span>
            </div>
            <span className="text-xs text-gray-400 text-center">{step.label}</span>
            {index < 4 && (
              <div className="hidden md:block absolute top-6 left-full w-4 h-0.5 bg-gray-600" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ArchitectureDiagram;