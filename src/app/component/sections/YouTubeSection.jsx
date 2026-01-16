'use client';

import { useState } from 'react';
import { ExternalLink, Play, Eye } from 'lucide-react';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@TheEconomicArchitect';

// Featured videos - manually curated thumbnails with video IDs
const FEATURED_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Building Agentic AI Systems from Scratch',
    duration: '12:34',
    views: '12K',
  },
  {
    id: 'abc123',
    title: 'LangGraph Tutorial: Complete Guide',
    duration: '24:18',
    views: '8.5K',
  },
  {
    id: 'def456',
    title: 'AutoGPT and the Future of AI Agents',
    duration: '18:45',
    views: '15K',
  },
  {
    id: 'ghi789',
    title: 'Building Production-Grade AI Pipelines',
    duration: '32:10',
    views: '22K',
  },
];

// Latest videos - placeholder structure (would need API for real data)
const LATEST_VIDEOS = [
  {
    id: 'xyz001',
    title: 'Introduction to Claude Code',
    duration: '8:20',
    views: '5K',
  },
  {
    id: 'xyz002',
    title: 'Multi-Agent Orchestration Patterns',
    duration: '15:45',
    views: '9K',
  },
  {
    id: 'xyz003',
    title: 'AI Agent Memory Systems',
    duration: '21:30',
    views: '11K',
  },
  {
    id: 'xyz004',
    title: 'Evaluating LLM Applications',
    duration: '14:15',
    views: '7.2K',
  },
];

const YouTubeSection = () => {
  const [activeTab, setActiveTab] = useState('featured');
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (videoId) => {
    setImageErrors(prev => ({ ...prev, [videoId]: true }));
  };

  const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  const getVideoUrl = (videoId) => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  };

  const currentVideos = activeTab === 'featured' ? FEATURED_VIDEOS : LATEST_VIDEOS;

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
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Tabs */}
      <div className="youtube-tabs">
        <button
          className={`youtube-tab ${activeTab === 'featured' ? 'active' : ''}`}
          onClick={() => setActiveTab('featured')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>Featured</span>
        </button>
        <button
          className={`youtube-tab ${activeTab === 'latest' ? 'active' : ''}`}
          onClick={() => setActiveTab('latest')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Latest</span>
        </button>
      </div>

      {/* Videos Grid - Using Thumbnails */}
      <div className="youtube-grid">
        {currentVideos.map((video) => (
          <a
            key={video.id}
            href={getVideoUrl(video.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="video-card"
          >
            <div className="video-card-thumbnail">
              <img
                src={imageErrors[video.id] ? '/placeholder-video.jpg' : getThumbnailUrl(video.id)}
                alt={video.title}
                onError={() => handleImageError(video.id)}
              />
              <div className="video-card-overlay">
                <Play size={32} fill="currentColor" />
              </div>
              <div className="video-card-duration">{video.duration}</div>
            </div>
            <div className="video-card-content">
              <h4 className="video-card-title">{video.title}</h4>
              <div className="video-card-meta">
                <span className="video-card-views">
                  <Eye size={12} />
                  <span>{video.views}</span>
                </span>
              </div>
            </div>
          </a>
        ))}

        {/* View All Card */}
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="youtube-view-all-card"
        >
          <div className="youtube-view-all-content">
            <Play size={28} fill="currentColor" />
            <span>View all videos</span>
            <ExternalLink size={18} />
          </div>
        </a>
      </div>
    </div>
  );
};

export default YouTubeSection;
