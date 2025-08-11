import { memo } from 'react';
import ReactMarkdown from 'react-markdown';

const ProjectCard = memo(({ project, onToggleReadme, expandedReadmes, readmeCache }) => (
  <article className="bg-gray-900/50 rounded-xl p-3 sm:p-4 border border-gray-700/50 w-full min-w-0">
    <div className="flex flex-col gap-2 mb-3">
      <h3 className="text-base font-bold text-white truncate">{project.title}</h3>
      <div className="flex items-center gap-2 text-xs">
        {project.stars > 0 && <span className="text-yellow-400">⭐ {project.stars}</span>}
        {project.language && <span className="bg-gray-700/50 px-2 py-1 rounded text-xs">{project.language}</span>}
      </div>
    </div>
    <p className="text-gray-300 text-xs mb-3 line-clamp-2">{project.description}</p>
    <div className="border-t border-gray-700/50 pt-2">
      <h4 className="text-orange-400 font-medium mb-1 text-xs truncate">{project.readmePreview?.heading || 'README'}</h4>
      <p className="text-gray-400 text-xs mb-2 line-clamp-2">{project.readmePreview?.text || 'No preview available'}</p>
      <button 
        onClick={() => onToggleReadme(project.id)}
        className="text-orange-400 hover:text-orange-300 text-xs"
      >
        {expandedReadmes[project.id] ? 'Hide' : 'Show'} README
      </button>
      {expandedReadmes[project.id] && (
        <div className="mt-2 p-3 bg-gray-800/30 rounded text-gray-300 text-sm max-h-96 overflow-y-auto prose-invert">
          {readmeCache[project.id] ? (
            <ReactMarkdown>{readmeCache[project.id]}</ReactMarkdown>
          ) : (
            <div>Loading README...</div>
          )}
        </div>
      )}
    </div>
    {project.url && (
      <div className="mt-2 pt-2 border-t border-gray-700/50">
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">
          View Code →
        </a>
      </div>
    )}
  </article>
));

ProjectCard.displayName = 'ProjectCard';
export default ProjectCard;