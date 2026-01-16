'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

const YOUTUBE_CHANNEL_ID = 'UCZMvtHQKHujVcg_FWVT1xtA';
const YOUTUBE_UPLOADS_ID = 'UUZMvtHQKHujVcg_FWVT1xtA'; // UC -> UU for uploads playlist
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@TheEconomicArchitect';
const YOUTUBE_FEATURED_PLAYLIST = 'PLnV40r8w-B4Lb2Jlfq6V7jODS07xH1f8R'; // Replace with your featured playlist ID

const YouTubeSection = () => {
  const [activeTab, setActiveTab] = useState('featured');

  return (
    <div className="youtube-section" id="videos">
      {/* Section Header */}
      <div className="youtube-header">
        <div className="youtube-title-row">
          <div className="youtube-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
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
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Tabs */}
      <div className="youtube-tabs">
        <button
          className={`youtube-tab ${activeTab === 'featured' ? 'active' : ''}`}
          onClick={() => setActiveTab('featured')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Featured</span>
        </button>
        <button
          className={`youtube-tab ${activeTab === 'latest' ? 'active' : ''}`}
          onClick={() => setActiveTab('latest')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Latest</span>
        </button>
      </div>

      {/* Videos Grid - Using YouTube Playlist Embeds */}
      <div className="youtube-playlists">
        {activeTab === 'featured' && (
          <div className="youtube-embed-container">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${YOUTUBE_FEATURED_PLAYLIST}&rel=0`}
              title="Featured Videos"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )}

        {activeTab === 'latest' && (
          <div className="youtube-embed-container">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${YOUTUBE_UPLOADS_ID}&rel=0`}
              title="Latest Videos"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        )}
      </div>

      {/* View All Link */}
      <a
        href={YOUTUBE_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-view-all"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span>View all videos on YouTube</span>
        <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default YouTubeSection;
