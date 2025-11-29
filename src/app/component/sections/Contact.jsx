import Card from '../ui/Card';
import Button from '../ui/Button';
import Section from '../ui/Section';
import { Github, Linkedin, Mail } from 'lucide-react';

const Contact = () => {
  return (
    <Section 
      id="contact"
      title="Let's Build Something"
      subtitle="Ready to architect reliable AI systems for your company"
    >
      <Card variant="gradient" className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Ready for Production AI?
          </h3>
          <p className="text-gray-400">
            Let&apos;s discuss how I can architect deterministic AI systems for your business.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="flex items-center gap-2"
            onClick={() => window.open('https://github.com/aparnap2', '_blank')}
          >
            <Github className="w-4 h-4" />
            GitHub
          </Button>
          <Button 
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => window.open('https://linkedin.com/in/aparna-pradhan', '_blank')}
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </Button>
          <Button 
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => window.location.href = 'mailto:contact@aparna.dev'}
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>
        </div>
      </Card>
    </Section>
  );
};

export default Contact;