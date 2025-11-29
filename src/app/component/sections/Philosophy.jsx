import Card from '../ui/Card';
import Section from '../ui/Section';
import { Shield, Clock, BarChart3 } from 'lucide-react';

const Philosophy = () => {
  const principles = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Validation > Prompting",
      description: "I don't trust LLMs. I force structured output via Pydantic.",
      color: "blue"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Queues > Timeouts", 
      description: "Real-world tasks take time. I build async-first with Redis.",
      color: "green"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Observability > Vibes",
      description: "If it's not logged in Langfuse, it didn't happen.",
      color: "purple"
    }
  ];

  return (
    <Section 
      title="Engineering Philosophy"
      subtitle="What separates senior engineers from bootcamp graduates"
    >
      <div className="grid md:grid-cols-3 gap-6">
        {principles.map((principle, index) => (
          <Card key={index} variant="glass" className="text-center">
            <div className={`w-12 h-12 bg-${principle.color}-600/20 border border-${principle.color}-500/30 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <span className={`text-${principle.color}-400`}>
                {principle.icon}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {principle.title}
            </h3>
            <p className="text-gray-400 text-sm">
              {principle.description}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
};

export default Philosophy;