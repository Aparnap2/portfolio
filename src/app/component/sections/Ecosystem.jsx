import Card from '../ui/Card';
import Button from '../ui/Button';
import TechStack from '../ui/TechStack';
import VideoEmbed from '../ui/VideoEmbed';
import Section from '../ui/Section';
import { Github, ExternalLink } from 'lucide-react';

const Ecosystem = () => {
  return (
    <Section 
      id="ecosystem"
      title="The Production Stack"
      subtitle="A complete AI system built from infrastructure to application"
    >
      <div className="grid md:grid-cols-2 gap-8">
        {/* Infrastructure */}
        <Card variant="gradient">
          <div className="mb-4">
            <span className="text-sm text-blue-400 font-medium">The Engine</span>
            <h3 className="text-2xl font-bold text-white mt-1">AI-Agent-OS</h3>
          </div>
          
          <p className="text-gray-400 mb-6">
            A local-first AI Operating System replacing $500/mo of SaaS. 
            Handles Caching, PII Redaction, and Observability.
          </p>
          
          <TechStack 
            title="Tech Stack"
            technologies={['Docker', 'LiteLLM', 'Redis', 'PostgreSQL', 'Langfuse']}
            className="mb-6"
          />
          
          <div className="flex gap-3">
            <Button size="sm" className="flex items-center gap-2">
              <Github className="w-4 h-4" />
              GitHub Repo
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Docs
            </Button>
          </div>
        </Card>

        {/* Application */}
        <Card variant="gradient">
          <div className="mb-4">
            <span className="text-sm text-purple-400 font-medium">The Product</span>
            <h3 className="text-2xl font-bold text-white mt-1">Invoicify</h3>
          </div>
          
          <p className="text-gray-400 mb-6">
            An Agentic Procurement Pipeline running on top of the OS. 
            Uses Pydantic to guarantee 100% math accuracy in invoice extraction.
          </p>
          
          <TechStack 
            title="Tech Stack"
            technologies={['FastAPI', 'Pydantic V2', 'Celery', 'React']}
            className="mb-6"
          />
          
          <VideoEmbed
            src="https://www.loom.com/embed/your-video-id"
            thumbnail="/api/placeholder/400/225"
            title="Invoicify Demo"
            className="mb-4"
          />
          
          <div className="flex gap-3">
            <Button size="sm" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Live Demo
            </Button>
            <Button variant="ghost" size="sm">
              Watch Loom Video
            </Button>
          </div>
        </Card>
      </div>
    </Section>
  );
};

export default Ecosystem;