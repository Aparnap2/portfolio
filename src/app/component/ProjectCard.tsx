'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronUp, ExternalLink, Star, GitFork, FolderGit2, Clock, FileText } from 'lucide-react';

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
  readme?: string | null;
  readmePreview?: { heading: string; text: string };
  commits?: Array<{ message: string; sha: string; date: string }>;
  languages?: Record<string, number>;
  license?: string;
  issues?: Array<{ title: string; state: string; labels: string[]; number: number; url: string }>;
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
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;

  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatNumber = (num: number): string => {
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
};

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
    Lua: '#000080',
    'Jupyter Notebook': '#DA5B0B',
  };
  return colors[language] || '#8b8b8b';
}

function getTotalBytes(languages: Record<string, number>): number {
  return Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const [showReadme, setShowReadme] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const stars = project.stars || project.stargazers_count || 0;
  const forks = project.forks || project.forks_count || 0;
  const repoUrl = project.url || project.html_url || '#';
  const repoName = project.name || 'Untitled Project';
  const title = project.title || repoName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const description = project.description;
  const topics = project.topics || [];
  const language = project.language || '';
  const updatedAt = project.updated_at || project.updated || project.pushed_at || null;
  const readme = project.readme || null;
  const readmePreview = project.readmePreview || null;
  const commits = project.commits || [];
  const languages = project.languages || {};
  const issues = project.issues || [];
  const totalCommits = commits.length;
  const openIssues = issues.filter(i => i.state === 'open').length;
  const languageCount = Object.keys(languages).length;
  const totalBytes = getTotalBytes(languages);

  const outcomeLine = useMemo(() => {
    if (!description) return 'Portfolio project demonstrating production AI system design.';
    const lower = description.toLowerCase();
    if (lower.includes('api') || lower.includes('integration')) return 'API integration with structured contracts and error handling.';
    if (lower.includes('deploy') || lower.includes('production')) return 'Production-grade system with monitoring and observability.';
    if (lower.includes('agent') || lower.includes('ai')) return 'Autonomous agent system with human-in-the-loop oversight.';
    if (lower.includes('rag') || lower.includes('retrieval')) return 'RAG system with measured retrieval precision and faithfulness.';
    if (lower.includes('pipeline') || lower.includes('data')) return 'Data pipeline designed for real-world edge cases.';
    if (lower.includes('monitor') || lower.includes('observ')) return 'Production monitoring and alerting architecture.';
    if (lower.includes('control') || lower.includes('tower')) return 'Control tower with deterministic classification and validation.';
    if (lower.includes('fp&a') || lower.includes('finance')) return 'Financial operations platform with variance detection and root-cause analysis.';
    return 'Production-grade system with governance, testing, and measurable outcomes.';
  }, [description]);

  return (
    <article className="gh-card gh-card--case-study">
      <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="gh-card-link-overlay" aria-label={`View ${repoName} on GitHub`} />

      <div className="gh-card-header">
        <div className="gh-card-icon">
          <FolderGit2 size={20} />
        </div>
        <div className="gh-card-title-row">
          <div>
            <div className="gh-card-context">Portfolio Project</div>
            <h3 className="gh-card-title">{title}</h3>
          </div>
          <span className="gh-card-link" aria-hidden="true">
            <ExternalLink size={14} />
          </span>
        </div>
      </div>

      <p className="gh-card-outcome">{outcomeLine}</p>

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

        {languageCount > 1 && (
          <span className="gh-card-lang" style={{ color: 'var(--color-text-tertiary)' }}>
            +{languageCount - 1} more
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
            <Clock size={12} style={{ marginRight: '2px' }} />
            {formatDate(updatedAt)}
          </span>
        )}
      </div>

      {topics.length > 0 && (
        <div className="gh-card-topics">
          {topics.slice(0, 5).map((topic) => (
            <span key={topic} className="gh-card-topic">
              {topic}
            </span>
          ))}
          {topics.length > 5 && (
            <span className="gh-card-topic" style={{ color: 'var(--color-text-tertiary)' }}>
              +{topics.length - 5}
            </span>
          )}
        </div>
      )}

      <div className="gh-card-actions">
        <button
          type="button"
          className="gh-card-toggle"
          onClick={(e) => {
            e.preventDefault();
            setShowDetails(!showDetails);
          }}
        >
          {showDetails ? (
            <>
              <ChevronUp size={14} />
              Details
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Details
            </>
          )}
        </button>

        {readme && (
          <button
            type="button"
            className="gh-card-toggle"
            onClick={(e) => {
              e.preventDefault();
              setShowReadme(!showReadme);
            }}
          >
            <FileText size={14} />
            {showReadme ? 'Hide README' : 'README'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="gh-card-details"
          >
            <div className="gh-card-details-grid">
              <div className="gh-card-detail-item">
                <span className="gh-card-detail-label">Commits</span>
                <span className="gh-card-detail-value">{totalCommits}</span>
              </div>
              <div className="gh-card-detail-item">
                <span className="gh-card-detail-label">Issues</span>
                <span className="gh-card-detail-value">{openIssues} open</span>
              </div>
              <div className="gh-card-detail-item">
                <span className="gh-card-detail-label">Primary</span>
                <span className="gh-card-detail-value">{language || 'N/A'}</span>
              </div>
              <div className="gh-card-detail-item">
                <span className="gh-card-detail-label">License</span>
                <span className="gh-card-detail-value">{project.license || 'None'}</span>
              </div>
            </div>

            {languageCount > 0 && (
              <div className="gh-card-languages">
                <span className="gh-card-detail-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
                  Languages ({languageCount})
                </span>
                <div className="gh-card-language-list">
                  {Object.entries(languages)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, bytes]) => {
                      const pct = totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0;
                      return (
                        <span key={lang} className="gh-card-language-item">
                          <span
                            className="gh-card-lang-dot"
                            style={{ background: getLanguageColor(lang) }}
                          />
                          {lang}
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{pct}%</span>
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {commits.length > 0 && (
              <div className="gh-card-commits">
                <span className="gh-card-detail-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
                  Recent Commits
                </span>
                <div className="gh-card-commit-list">
                  {commits.slice(0, 3).map((commit) => (
                    <a
                      key={commit.sha}
                      href={repoUrl + '/commit/' + commit.sha}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gh-card-commit-item"
                    >
                      <span className="gh-card-commit-sha">{commit.sha}</span>
                      <span className="gh-card-commit-msg">{commit.message}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {issues.length > 0 && (
              <div className="gh-card-issues">
                <span className="gh-card-detail-label" style={{ display: 'block', marginBottom: 'var(--space-sm)' }}>
                  Issues
                </span>
                <div className="gh-card-issue-list">
                  {issues.slice(0, 3).map((issue) => (
                    <a
                      key={issue.number}
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gh-card-issue-item"
                    >
                      <span className={`gh-card-issue-state ${issue.state === 'open' ? 'gh-card-issue-open' : 'gh-card-issue-closed'}`}>
                        {issue.state === 'open' ? '○' : '●'}
                      </span>
                      <span className="gh-card-issue-title">{issue.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReadme && readme && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="gh-card-readme"
          >
            <div className="gh-card-readme-header">
              <h4 className="gh-card-readme-title">
                {readmePreview?.heading || 'README'}
              </h4>
            </div>
            <div className="gh-card-readme-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {readme}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};

export default ProjectCard;
