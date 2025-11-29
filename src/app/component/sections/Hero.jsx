import Button from '../ui/Button';
import Section from '../ui/Section';
import Image from 'next/image';
import me from '../../public/images/me.jpeg';

const Hero = () => {
  return (
    <Section className="pt-24 pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              I Engineer Reliable AI Systems,{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Not Just Chatbots
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-8">
              AI Application Engineer specializing in <strong className="text-white">Agentic Workflows</strong> and{' '}
              <strong className="text-white">Local-First Infrastructure</strong>. I build deterministic, 
              cost-efficient systems using Python, FastAPI, and GraphRAG.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" onClick={() => document.getElementById('architecture')?.scrollIntoView()}>
                View The Architecture
              </Button>
              <Button variant="secondary" size="lg" onClick={() => document.getElementById('ecosystem')?.scrollIntoView()}>
                Watch Demos
              </Button>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <div className="relative w-64 h-64 lg:w-80 lg:h-80">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-20"></div>
              <Image
                src={me}
                alt="Aparna Pradhan - AI Engineer"
                width={320}
                height={320}
                className="relative z-10 w-full h-full object-cover rounded-full border-4 border-gray-700/50"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Hero;