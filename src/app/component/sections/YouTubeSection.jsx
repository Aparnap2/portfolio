'use client';

import { Youtube, ExternalLink, Play, Video } from 'lucide-react';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@TheEconomicArchitect';
const YOUTUBE_FEATURED_PLAYLIST = 'PLnV40r8w-B4Lb2Jlfq6V7jODS07xH1f8R';

const featuredTopics = [
  "Agentic AI Systems",
  "Workflow Orchestration",
  "Production AI Deployment",
  "Go & Python Tutorials"
];

const YouTubeSection = () => {
  return (
    <div className="youtube-section" id="videos">
      {/* Section Header */}
      <div className="youtube-header">
        <div className="youtube-title-row">
          <div className="youtube-icon-wrapper">
            <Youtube size={24} />
          </div>
          <div>
            <h2 className="youtube-title">YouTube</h2>
            <p className="youtube-subtitle">Tech talks, tutorials, and agentic AI systems</p>
          </div>
        </div>

        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="youtube-channel-link"
        >
          <span>@TheEconomicArchitect</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Featured Topics */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-xl)'
      }}>
        {featuredTopics.map((topic, index) => (
          <span key={index} style={{
            padding: 'var(--space-xs) var(--space-md)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)'
          }}>
            <Video size={14} style={{ color: 'var(--color-accent)' }} />
            {topic}
          </span>
        ))}
      </div>

      {/* Featured Playlist Card */}
      <a
        href={`https://www.youtube.com/playlist?list=${YOUTUBE_FEATURED_PLAYLIST}`}
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-playlist-card"
      >
        <div className="youtube-playlist-thumbnail">
          <div className="youtube-playlist-overlay">
            <div className="youtube-play-button-large">
              <Play size={32} fill="currentColor" />
            </div>
          </div>
          <span className="youtube-playlist-count">View Playlist</span>
        </div>
        <div className="youtube-playlist-info">
          <h3 className="youtube-playlist-title">Featured Videos</h3>
          <p className="youtube-playlist-desc">Watch my latest tech talks and tutorials on AI systems, workflow orchestration, and production deployment.</p>
          <span className="youtube-playlist-cta">
            Open in YouTube <ExternalLink size={14} />
          </span>
        </div>
      </a>

      {/* View All Link */}
      <a
        href={YOUTUBE_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-view-all"
      >
        <Youtube size={20} />
        <span>Watch more on YouTube</span>
        <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default YouTubeSection;
