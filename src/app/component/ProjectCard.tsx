'use client';

import { useState, useEffect, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import {
  Github,
  Star,
  GitFork,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';

const MAX_README_LENGTH = 500;
const README_CACHE = new Map();
const FETCH_PROMISES = new Map();

interface ProjectCardProps {
  project: {
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
    pushed_at?: string;
    topics?: string[];
    owner?: { login: string };
  };
}

const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
};

const fetchReadme = async (owner: string, repo: string): Promise<string> => {
  const cacheKey = `${owner}/${repo}`;

  // Return cached content if available
  if (README_CACHE.has(cacheKey)) {
    return README_CACHE.get(cacheKey)!;
  }

  // Return pending promise if already fetching
  if (FETCH_PROMISES.has(cacheKey)) {
    return FETCH_PROMISES.get(cacheKey)!;
  }

  // Start new fetch
  const promise = (async () => {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`
      );
      if (!response.ok) {
        // Try master branch
        const masterResponse = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`
        );
        if (!masterResponse.ok) {
          throw new Error('README not found');
        }
        const text = await masterResponse.text();
        README_CACHE.set(cacheKey, text);
        return text;
      }
      const text = await response.text();
      README_CACHE.set(cacheKey, text);
      return text;
    } catch {
      README_CACHE.set(cacheKey, '');
      return '';
    }
  })();

  FETCH_PROMISES.set(cacheKey, promise);
  return promise;
};

const ReadmePreview = memo(function ReadmePreview({
  content,
  isExpanded,
  onToggle,
}: {
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (!content) return null;

  const displayContent = isExpanded
    ? content
    : content.slice(0, MAX_README_LENGTH);

  const needsToggle = content.length > MAX_README_LENGTH && !isExpanded;

  return (
    <div className="project-readme">
      <div className="project-readme-header">
        <FileText size={14} />
        <span>README.md</span>
      </div>
      <div className={`project-readme-content ${isExpanded ? 'expanded' : ''}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkEmoji]}
          components={{
            h1: ({ children }) => (
              <h4 className="readme-h1">{children}</h4>
            ),
            h2: ({ children }) => (
              <h5 className="readme-h2">{children}</h5>
            ),
            h3: ({ children }) => (
              <h6 className="readme-h3">{children}</h6>
            ),
            p: ({ children }) => (
              <p className="readme-p">{children}</p>
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
                <ExternalLink size={10} />
              </a>
            ),
            code: ({ className, children }) => {
              const isInline = !className;
              return isInline ? (
                <code className="readme-inline-code">{children}</code>
              ) : (
                <code className={`readme-code-block ${className || ''}`}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <pre className="readme-pre">{children}</pre>,
            ul: ({ children }) => (
              <ul className="readme-ul">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="readme-ol">{children}</ol>
            ),
            li: ({ children }) => <li className="readme-li">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="readme-blockquote">{children}</blockquote>
            ),
            strong: ({ children }) => (
              <strong className="readme-strong">{children}</strong>
            ),
            em: ({ children }) => <em className="readme-em">{children}</em>,
            table: ({ children }) => (
              <div className="readme-table-wrapper">{children}</div>
            ),
          }}
        >
          {(displayContent + (needsToggle ? '...' : '')) as string}
        </ReactMarkdown>
      </div>
      {needsToggle && (
        <button className="readme-toggle" onClick={onToggle}>
          <span>Read more</span>
          <ChevronDown size={14} />
        </button>
      )}
      {isExpanded && content.length > MAX_README_LENGTH && (
        <button className="readme-toggle" onClick={onToggle}>
          <span>Show less</span>
          <ChevronUp size={14} />
        </button>
      )}
    </div>
  );
});

const ProjectCard = memo(function ProjectCard({ project }: ProjectCardProps) {
  const [readme, setReadme] = useState<string>('');
  const [readmeExpanded, setReadmeExpanded] = useState(false);
  const [isLoadingReadme, setIsLoadingReadme] = useState(false);

  const stars = project.stars || project.stargazers_count || 0;
  const forks = project.forks || project.forks_count || 0;
  const repoUrl = project.url || project.html_url || '';
  const repoName = project.title || project.name || 'Untitled Project';
  const owner = project.owner?.login || '';

  // Extract owner/repo from URL if owner is not provided
  const getOwnerRepo = (): { owner: string; repo: string } | null => {
    if (owner) return { owner, repo: repoName };
    if (repoUrl) {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace(/\/$/, '') };
      }
    }
    return null;
  };

  useEffect(() => {
    const ownerRepo = getOwnerRepo();
    if (!ownerRepo || readme !== '') return;

    const loadReadme = async () => {
      setIsLoadingReadme(true);
      try {
        const content = await fetchReadme(ownerRepo.owner, ownerRepo.repo);
        setReadme(content);
      } finally {
        setIsLoadingReadme(false);
      }
    };

    loadReadme();
  }, [repoUrl, owner, repoName, readme]);

  const handleToggleReadme = () => {
    setReadmeExpanded(!readmeExpanded);
  };

  return (
    <div className="project-card">
      <div className="project-card-header-row">
        <div className="project-card-header-left">
          <Github size={18} className="project-card-icon" />
          <div className="project-card-title-wrapper">
            <h3 className="project-card-title">{repoName}</h3>
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card-link"
            >
              <span>View on GitHub</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <div className="project-card-actions">
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card-external"
              aria-label="Open repository"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>

      <p className="project-card-description">
        {project.description || 'No description available'}
      </p>

      {readme && (
        <ReadmePreview
          content={readme}
          isExpanded={readmeExpanded}
          onToggle={handleToggleReadme}
        />
      )}

      {isLoadingReadme && (
        <div className="project-readme-loading">
          <div className="loading-spinner-small" />
          <span>Loading README...</span>
        </div>
      )}

      <div className="project-card-meta">
        {project.language && (
          <span className="project-language">
            <span
              className="project-language-dot"
              style={{ background: getLanguageColor(project.language) }}
            />
            <span>{project.language}</span>
          </span>
        )}

        {(stars > 0 || forks > 0) && (
          <div className="project-stats">
            {stars > 0 && (
              <span className="project-stat" title="Stars">
                <Star size={14} />
                <span>{formatNumber(stars)}</span>
              </span>
            )}
            {forks > 0 && (
              <span className="project-stat" title="Forks">
                <GitFork size={14} />
                <span>{formatNumber(forks)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {project.topics && project.topics.length > 0 && (
        <div className="project-topics">
          {project.topics.slice(0, 6).map((topic) => (
            <span key={topic} className="project-topic">
              {topic}
            </span>
          ))}
        </div>
      )}

      <div className="project-card-footer">
        <Calendar size={14} />
        <span>Updated {formatDate(project.updated_at || project.pushed_at)}</span>
        {readme && (
          <a
            href={`${repoUrl}/blob/main/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="project-readme-link"
          >
            <LinkIcon size={12} />
            <span>Full README</span>
          </a>
        )}
      </div>
    </div>
  );
});

// Helper function for language colors
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
    React: '#61dafb',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Jupyter: '#DA5B0B',
    Scala: '#c22d40',
    R: '#198CE7',
    Elixir: '#6e4a7e',
    Clojure: '#91dc47',
    Haskell: '#5e5086',
    Lua: '#000080',
    Perl: '#0298c3',
    Objective: '#438eff',
    C: '#555555',
    'C#': '#178600',
    Zig: '#f77a00',
  };
  return colors[language] || '#8b8b8b';
}

export default ProjectCard;
