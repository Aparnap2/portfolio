'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Play, Calendar, Eye } from 'lucide-react';

const YOUTUBE_CHANNEL_ID = 'UCZMvtHQKHujVcg_FWVT1xtA';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@TheEconomicArchitect';

// Video data for @TheEconomicArchitect channel
// Add your actual video IDs here - get from YouTube watch URLs
const CHANNEL_VIDEOS = [
  {
    id: 'video-id-1',
    title: 'Building Autonomous Agentic AI Systems with LangGraph',
    thumbnail: 'https://img.youtube.com/vi/video-id-1/maxresdefault.jpg',
    viewCount: 50000,
    publishedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'video-id-2',
    title: 'State Machines for Production AI: A Deep Dive',
    thumbnail: 'https://img.youtube.com/vi/video-id-2/maxresdefault.jpg',
    viewCount: 42000,
    publishedAt: '2025-01-10T14:30:00Z',
  },
  {
    id: 'video-id-3',
    title: 'Human-in-the-Loop AI: Safety Patterns for Autonomous Systems',
    thumbnail: 'https://img.youtube.com/vi/video-id-3/maxresdefault.jpg',
    viewCount: 38000,
    publishedAt: '2025-01-05T09:00:00Z',
  },
  {
    id: 'video-id-4',
    title: 'PostgreSQL + pgvector for Agent Memory Management',
    thumbnail: 'https://img.youtube.com/vi/video-id-4/maxresdefault.jpg',
    viewCount: 35000,
    publishedAt: '2024-12-28T16:00:00Z',
  },
  {
    id: 'video-id-5',
    title: 'Economic Modelling with Python: From Data to Insights',
    thumbnail: 'https://img.youtube.com/vi/video-id-5/maxresdefault.jpg',
    viewCount: 62000,
    publishedAt: '2024-12-20T11:00:00Z',
  },
  {
    id: 'video-id-6',
    title: 'Pydantic-AI: Type-Safe Agents for Production',
    thumbnail: 'https://img.youtube.com/vi/video-id-6/maxresdefault.jpg',
    viewCount: 48000,
    publishedAt: '2024-12-15T13:00:00Z',
  },
  {
    id: 'video-id-7',
    title: 'Redis Queues for Resilient AI Workflows',
    thumbnail: 'https://img.youtube.com/vi/video-id-7/maxresdefault.jpg',
    viewCount: 29000,
    publishedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: 'video-id-8',
    title: 'Monitoring & Observability for LLM Applications',
    thumbnail: 'https://img.youtube.com/vi/video-id-8/maxresdefault.jpg',
    viewCount: 45000,
    publishedAt: '2024-12-05T15:00:00Z',
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

        // Use channel video data
        setVideos(CHANNEL_VIDEOS);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch YouTube videos:', err);
        // Use channel video data on error
        setVideos(CHANNEL_VIDEOS);
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
