'use client';

import { Youtube, ExternalLink, Play } from 'lucide-react';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@TheEconomicArchitect';
const YOUTUBE_FEATURED_PLAYLIST = 'PLnV40r8w-B4Lb2Jlfq6V7jODS07xH1f8R';

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
          <p className="youtube-playlist-desc">Watch my latest tech talks and tutorials on AI systems</p>
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
