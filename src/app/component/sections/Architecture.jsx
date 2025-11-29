import Section from '../ui/Section';
import ArchitectureDiagram from '../ui/ArchitectureDiagram';

const Architecture = () => {
  return (
    <Section 
      id="architecture"
      title="How I Think"
      subtitle="Founders hire architects. This proves system design thinking."
    >
      <ArchitectureDiagram />
    </Section>
  );
};

export default Architecture;