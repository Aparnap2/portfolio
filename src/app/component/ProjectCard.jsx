'use client';

import { memo } from 'react';
import { Github, Star, GitFork, Calendar, ExternalLink } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ProjectCard = memo(function ProjectCard({ project }) {
  const stars = project.stars || project.stargazers_count || 0;
  const forks = project.forks || project.forks_count || 0;

  return (
    <a
      href={project.url || project.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="project-card"
    >
      <div className="project-card-header">
        <Github size={20} />
        <ExternalLink size={16} />
      </div>

      <h3 className="project-card-title">{project.title || project.name}</h3>

      <p className="project-card-description">
        {project.description || 'No description available'}
      </p>

      <div className="project-card-meta">
        {project.language && (
          <span className="project-language">
            <span className="project-language-dot" style={{ background: getLanguageColor(project.language) }} />
            {project.language}
          </span>
        )}

        {(stars > 0 || forks > 0) && (
          <div className="project-stats">
            {stars > 0 && (
              <span className="project-stat">
                <Star size={14} />
                {stars}
              </span>
            )}
            {forks > 0 && (
              <span className="project-stat">
                <GitFork size={14} />
                {forks}
              </span>
            )}
          </div>
        )}
      </div>

      {project.topics?.length > 0 && (
        <div className="project-topics">
          {project.topics.slice(0, 4).map((topic) => (
            <span key={topic} className="project-topic">{topic}</span>
          ))}
        </div>
      )}

      <div className="project-card-footer">
        <Calendar size={14} />
        <span>Updated {formatDate(project.updated || project.pushed)}</span>
      </div>
    </a>
  );
});

// Helper function for language colors
function getLanguageColor(language) {
  const colors = {
    Python: '#3572A5',
    TypeScript: '#2b7489',
    JavaScript: '#f1e05a',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    'C++': '#f34b7d',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Vue: '#41b883',
    React: '#61dafb',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
  };
  return colors[language] || '#8b8b8b';
}

export default ProjectCard;
