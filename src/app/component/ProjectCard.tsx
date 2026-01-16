'use client';

import { memo } from 'react';
import {
  Github,
  Star,
  GitFork,
  ExternalLink,
  FolderGit2,
} from 'lucide-react';

interface Project {
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  url?: string;
  html_url?: string;
  language?: string;
  stars?: number;
  stargazers_count?: number;
  forks?: number;
  forks_count?: number;
  updated_at?: string;
  updated?: string;
  pushed_at?: string;
  topics?: string[];
  owner?: { login: string };
}

interface ProjectCardProps {
  project: Project;
}

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatNumber = (num: number): string => {
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

const ProjectCard = memo(function ProjectCard({ project }: ProjectCardProps) {
  const stars = project.stars || project.stargazers_count || 0;
  const forks = project.forks || project.forks_count || 0;
  const repoUrl = project.url || project.html_url || '';
  const repoName = project.name || 'Untitled Project';
  const title = project.title || repoName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const description = project.description || null;
  const topics = project.topics || [];
  const language = project.language || '';
  const updatedAt = project.updated_at || project.updated || project.pushed_at || null;

  return (
    <article className="gh-card">
      {/* Entire card clickable overlay */}
      <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="gh-card-link-overlay" aria-label={`View ${repoName} on GitHub`} />

      <div className="gh-card-header">
        <div className="gh-card-icon">
          <FolderGit2 size={20} />
        </div>
        <div className="gh-card-title-row">
          <h3 className="gh-card-title">{title}</h3>
          <span className="gh-card-link" aria-hidden="true">
            <ExternalLink size={14} />
          </span>
        </div>
      </div>

      {description && (
        <p className="gh-card-description">
          {description}
        </p>
      )}

      <div className="gh-card-meta">
        {language && (
          <span className="gh-card-lang">
            <span
              className="gh-card-lang-dot"
              style={{ background: getLanguageColor(language) }}
            />
            {language}
          </span>
        )}

        {(stars > 0 || forks > 0) && (
          <div className="gh-card-stats">
            {stars > 0 && (
              <span className="gh-card-stat">
                <Star size={14} />
                {formatNumber(stars)}
              </span>
            )}
            {forks > 0 && (
              <span className="gh-card-stat">
                <GitFork size={14} />
                {formatNumber(forks)}
              </span>
            )}
          </div>
        )}

        {updatedAt && (
          <span className="gh-card-date">
            {formatDate(updatedAt)}
          </span>
        )}
      </div>

      {topics.length > 0 && (
        <div className="gh-card-topics">
          {topics.slice(0, 4).map((topic) => (
            <span key={topic} className="gh-card-topic">
              {topic}
            </span>
          ))}
        </div>
      )}
    </article>
  );
});

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    Python: '#3572A5',
    TypeScript: '#3178c6',
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
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
  };
  return colors[language] || '#8b8b8b';
}

export default ProjectCard;
