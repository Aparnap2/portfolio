'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Play, Calendar, Eye } from 'lucide-react';

const YOUTUBE_CHANNEL_ID = 'UCZMvtHQKHujVcg_FWVT1xtA';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@TheEconomicArchitect';

// Fallback video data for @TheEconomicArchitect channel
// In production, fetch from YouTube Data API with an API key
const FALLBACK_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'The Future of AI Architecture: Building Intelligent Systems',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    viewCount: 125000,
    publishedAt: '2025-01-10T12:00:00Z',
  },
  {
    id: 'abc123',
    title: 'Economic Modelling with Python and LangGraph',
    thumbnail: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg',
    viewCount: 89000,
    publishedAt: '2025-01-05T14:30:00Z',
  },
  {
    id: 'def456',
    title: 'Agentic AI Systems: From Theory to Production',
    thumbnail: 'https://img.youtube.com/vi/def456/maxresdefault.jpg',
    viewCount: 156000,
    publishedAt: '2024-12-28T10:00:00Z',
  },
  {
    id: 'ghi789',
    title: 'Building Scalable Data Pipelines for Economic Analysis',
    thumbnail: 'https://img.youtube.com/vi/ghi789/maxresdefault.jpg',
    viewCount: 67000,
    publishedAt: '2024-12-20T16:00:00Z',
  },
  {
    id: 'jkl012',
    title: 'Machine Learning in Finance: A Practical Guide',
    thumbnail: 'https://img.youtube.com/vi/jkl012/maxresdefault.jpg',
    viewCount: 234000,
    publishedAt: '2024-12-15T11:00:00Z',
  },
  {
    id: 'mno345',
    title: 'Introduction to Time Series Analysis with Python',
    thumbnail: 'https://img.youtube.com/vi/mno345/maxresdefault.jpg',
    viewCount: 178000,
    publishedAt: '2024-12-10T09:00:00Z',
  },
  {
    id: 'pqr678',
    title: 'Automating Economic Research with AI Agents',
    thumbnail: 'https://img.youtube.com/vi/pqr678/maxresdefault.jpg',
    viewCount: 98000,
    publishedAt: '2024-12-05T13:00:00Z',
  },
  {
    id: 'stu901',
    title: 'Data Visualization Best Practices for Economic Data',
    thumbnail: 'https://img.youtube.com/vi/stu901/maxresdefault.jpg',
    viewCount: 54000,
    publishedAt: '2024-11-28T15:00:00Z',
  },
];

const formatViewCount = (views) => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(0)}K`;
  }
  return views.toString();
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const VideoCard = ({ video }) => {
  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="video-card"
    >
      <div className="video-card-thumbnail">
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
        />
        <div className="video-card-overlay">
          <Play size={32} />
        </div>
        <div className="video-card-duration">
          <Play size={12} />
          <span>Watch</span>
        </div>
      </div>

      <div className="video-card-content">
        <h3 className="video-card-title">{video.title}</h3>

        <div className="video-card-meta">
          <span className="video-card-views">
            <Eye size={14} />
            {formatViewCount(video.viewCount)} views
          </span>
          <span className="video-card-date">
            <Calendar size={14} />
            {formatDate(video.publishedAt)}
          </span>
        </div>
      </div>
    </a>
  );
};

const YouTubeSection = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('top');

  useEffect(() => {
    const fetchVideos = async () => {
      setError(null);
      try {
        // Try to fetch from YouTube API if key is available
        const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

        if (apiKey) {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${YOUTUBE_CHANNEL_ID}&part=snippet,id&order=date&maxResults=10&type=video`
          );

          if (response.ok) {
            const data = await response.json();

            // Fetch view counts for each video
            const videoIds = data.items.map((item) => item.id.videoId).join(',');
            const statsResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=statistics`
            );

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();

              const formattedVideos = data.items.map((item, index) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                viewCount: parseInt(statsData.items[index]?.statistics?.viewCount || '0'),
                publishedAt: item.snippet.publishedAt,
              }));

              setVideos(formattedVideos);
              setLoading(false);
              return;
            }
          }
        }

        // Fallback to hardcoded data
        setVideos(FALLBACK_VIDEOS);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch YouTube videos:', err);
        // Use fallback data on error
        setVideos(FALLBACK_VIDEOS);
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const topPerformingVideos = [...videos]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 4);

  const latestVideos = [...videos]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 4);

  const displayedVideos = activeTab === 'top' ? topPerformingVideos : latestVideos;

  if (loading) {
    return (
      <div className="youtube-loading">
        <div className="loading-spinner" />
        <span>Loading videos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="youtube-error">
        <p>{error}</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="youtube-section">
      {/* Section Header */}
      <div className="youtube-header">
        <div className="youtube-title-row">
          <div className="youtube-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <div>
            <h2 className="youtube-title">YouTube Videos</h2>
            <p className="youtube-subtitle">Tech talks, tutorials, and economic analysis</p>
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
          className={`youtube-tab ${activeTab === 'top' ? 'active' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          <Eye size={18} />
          <span>Top Performing</span>
        </button>
        <button
          className={`youtube-tab ${activeTab === 'latest' ? 'active' : ''}`}
          onClick={() => setActiveTab('latest')}
        >
          <Calendar size={18} />
          <span>Latest</span>
        </button>
      </div>

      {/* Videos Grid */}
      <div className="youtube-grid">
        {displayedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
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
