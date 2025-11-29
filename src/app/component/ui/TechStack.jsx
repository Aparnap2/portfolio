import Badge from './Badge';

const TechStack = ({ 
  technologies = [], 
  title,
  className = '' 
}) => {
  return (
    <div className={className}>
      {title && (
        <h4 className="text-sm font-medium text-gray-400 mb-3">{title}</h4>
      )}
      <div className="flex flex-wrap gap-2">
        {technologies.map((tech, index) => (
          <Badge key={index} variant="tech" size="sm">
            {tech}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TechStack;