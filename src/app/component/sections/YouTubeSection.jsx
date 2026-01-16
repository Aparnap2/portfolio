'use client';

import { YouTubeEmbed } from '@next/third-parties/google';
import { ExternalLink } from 'lucide-react';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@TheEconomicArchitect';
const YOUTUBE_FEATURED_PLAYLIST = 'PLnV40r8w-B4Lb2Jlfq6V7jODS07xH1f8R';
const YOUTUBE_UPLOADS_ID = 'UUZMvtHQKHujVcg_FWVT1xtA';

const YouTubeSection = () => {
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

      {/* Featured Playlist Embed */}
      <div className="youtube-embed-wrapper">
        <YouTubeEmbed
          videoid="videoseries"
          params={`list=${YOUTUBE_FEATURED_PLAYLIST}`}
          height={400}
          width={800}
          style="border-radius: 12px; width: 100%;"
          title="Featured Videos"
        />
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
