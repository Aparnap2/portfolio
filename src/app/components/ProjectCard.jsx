import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const ProjectCard = memo(({ project, onToggleReadme, expandedReadmes, readmeCache }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getLanguagePercentages = (languages) => {
    const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    return Object.entries(languages).map(([lang, bytes]) => ({
      language: lang,
      percentage: ((bytes / total) * 100).toFixed(1),
      bytes
    })).sort((a, b) => b.bytes - a.bytes);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'commits', label: `Commits (${project.commits?.length || 0})` },
    { id: 'issues', label: `Issues (${project.issues?.length || 0})` },
    { id: 'languages', label: 'Languages' }
  ];

  return (
    <article className="bg-gray-900/50 rounded-xl p-3 sm:p-4 border border-gray-700/50 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="text-base font-bold text-white truncate">{project.title}</h3>
        
        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          {project.stars > 0 && <span className="text-yellow-400">⭐ {project.stars}</span>}
          {project.forks > 0 && <span className="text-blue-400">🍴 {project.forks}</span>}
          {project.watchers > 0 && <span className="text-green-400">👁 {project.watchers}</span>}
          {project.license && project.license !== 'No license' && (
            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded">{project.license}</span>
          )}
        </div>

        {/* Topics */}
        {project.topics && project.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.topics.slice(0, 5).map((topic) => (
              <span key={topic} className="bg-orange-600/20 text-orange-300 px-2 py-1 rounded text-xs">
                {topic}
              </span>
            ))}
            {project.topics.length > 5 && (
              <span className="text-gray-400 text-xs">+{project.topics.length - 5} more</span>
            )}
          </div>
        )}

        <p className="text-gray-300 text-xs line-clamp-2">{project.description}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700/50 mb-3">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-400 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Repository Info Table */}
            <div>
              <h4 className="text-orange-400 font-medium mb-2 text-sm">Repository Information</h4>
              <div className="bg-gray-800/30 rounded p-3">
                <table className="w-full text-xs">
                  <tbody className="space-y-1">
                    <tr>
                      <td className="text-gray-400 pr-3">Created:</td>
                      <td className="text-gray-300">{formatDate(project.created)}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-400 pr-3">Updated:</td>
                      <td className="text-gray-300">{formatDate(project.updated)}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-400 pr-3">Size:</td>
                      <td className="text-gray-300">{formatBytes(project.size * 1024)}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-400 pr-3">Default Branch:</td>
                      <td className="text-gray-300">{project.defaultBranch}</td>
                    </tr>
                    <tr>
                      <td className="text-gray-400 pr-3">Open Issues:</td>
                      <td className="text-gray-300">{project.openIssues}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-orange-400 font-medium mb-2 text-sm">Features</h4>
              <div className="flex gap-2 flex-wrap">
                {project.hasWiki && <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-xs">Wiki</span>}
                {project.hasPages && <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">Pages</span>}
                {project.hasProjects && <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">Projects</span>}
              </div>
            </div>

            {/* README Preview */}
            <div>
              <h4 className="text-orange-400 font-medium mb-2 text-sm">{project.readmePreview?.heading || 'README'}</h4>
              <p className="text-gray-400 text-xs mb-2 line-clamp-3">{project.readmePreview?.text || 'No preview available'}</p>
              <button 
                onClick={() => onToggleReadme(project.id)}
                className="text-orange-400 hover:text-orange-300 text-xs"
              >
                {expandedReadmes[project.id] ? 'Hide' : 'Show'} Full README
              </button>
              {expandedReadmes[project.id] && (
                <div className="mt-3 p-3 bg-gray-800/30 rounded text-gray-300 text-sm max-h-96 overflow-y-auto prose prose-invert prose-sm">
                  {readmeCache[project.id] ? (
                    <ReactMarkdown>{readmeCache[project.id]}</ReactMarkdown>
                  ) : (
                    <div>Loading README...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'commits' && (
          <div>
            <h4 className="text-orange-400 font-medium mb-3 text-sm">Recent Commits</h4>
            {project.commits && project.commits.length > 0 ? (
              <div className="bg-gray-800/30 rounded overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-700/50">
                      <th className="text-left p-3 text-gray-300 font-medium">Message</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Author</th>
                      <th className="text-left p-3 text-gray-300 font-medium">Date</th>
                      <th className="text-left p-3 text-gray-300 font-medium">SHA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.commits.map((commit, index) => (
                      <tr key={commit.sha} className={`border-b border-gray-700/30 ${index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/10'}`}>
                        <td className="p-3 text-gray-300 max-w-[250px]">
                          <a href={commit.url} target="_blank" rel="noopener noreferrer" 
                             className="hover:text-orange-400 transition-colors block truncate">
                            {commit.message}
                          </a>
                        </td>
                        <td className="p-3 text-gray-400 whitespace-nowrap">{commit.author}</td>
                        <td className="p-3 text-gray-400 whitespace-nowrap">{formatDate(commit.date)}</td>
                        <td className="p-3 text-blue-400 font-mono">{commit.sha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-xs">No commits available</p>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div>
            <h4 className="text-orange-400 font-medium mb-3 text-sm">Issues</h4>
            {project.issues && project.issues.length > 0 ? (
              <div className="bg-gray-800/30 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-700/30">
                      <th className="text-left p-2 text-gray-300">#</th>
                      <th className="text-left p-2 text-gray-300">Title</th>
                      <th className="text-left p-2 text-gray-300">State</th>
                      <th className="text-left p-2 text-gray-300">Labels</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.issues.map((issue, index) => (
                      <tr key={issue.number} className={index % 2 === 0 ? 'bg-gray-800/20' : ''}>
                        <td className="p-2 text-blue-400">#{issue.number}</td>
                        <td className="p-2 text-gray-300 max-w-[200px] truncate">
                          <a href={issue.url} target="_blank" rel="noopener noreferrer" 
                             className="hover:text-orange-400 transition-colors">
                            {issue.title}
                          </a>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            issue.state === 'open' 
                              ? 'bg-green-600/20 text-green-300' 
                              : 'bg-red-600/20 text-red-300'
                          }`}>
                            {issue.state}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1 flex-wrap">
                            {issue.labels.slice(0, 2).map((label) => (
                              <span key={label} className="bg-gray-600/30 text-gray-300 px-1 py-0.5 rounded text-xs">
                                {label}
                              </span>
                            ))}
                            {issue.labels.length > 2 && (
                              <span className="text-gray-500 text-xs">+{issue.labels.length - 2}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-xs">No issues found</p>
            )}
          </div>
        )}

        {activeTab === 'languages' && (
          <div>
            <h4 className="text-orange-400 font-medium mb-3 text-sm">Languages Used</h4>
            {project.languages && Object.keys(project.languages).length > 0 ? (
              <div className="bg-gray-800/30 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-700/30">
                      <th className="text-left p-2 text-gray-300">Language</th>
                      <th className="text-left p-2 text-gray-300">Percentage</th>
                      <th className="text-left p-2 text-gray-300">Bytes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getLanguagePercentages(project.languages).map((lang, index) => (
                      <tr key={lang.language} className={index % 2 === 0 ? 'bg-gray-800/20' : ''}>
                        <td className="p-2 text-gray-300 font-medium">{lang.language}</td>
                        <td className="p-2 text-gray-400">{lang.percentage}%</td>
                        <td className="p-2 text-gray-400">{formatBytes(lang.bytes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-xs">No language data available</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
        <span className="text-gray-500 text-xs">Updated {formatDate(project.updated)}</span>
        <a href={project.url} target="_blank" rel="noopener noreferrer" 
           className="text-blue-400 hover:text-blue-300 text-xs font-medium">
          View on GitHub →
        </a>
      </div>
    </article>
  );
});

ProjectCard.displayName = 'ProjectCard';
export default ProjectCard;