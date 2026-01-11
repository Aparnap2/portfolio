'use client';

import { useState, useEffect, useTransition } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw, TrendingUp, Globe, Cpu, Cloud, Briefcase } from 'lucide-react';
import Section from '../ui/Section';

// RSS Feed sources
const NEWS_SOURCES = [
  {
    id: 'hackernews',
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/rss',
    icon: TrendingUp,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    tag: 'Tech',
  },
  {
    id: 'aws',
    name: 'AWS Blog',
    url: 'https://aws.amazon.com/blogs/aws/feed/',
    icon: Cloud,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    tag: 'Cloud',
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    url: 'https://cloud.google.com/blog/feeds/posts.xml?alt=rss',
    icon: Cpu,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    tag: 'AI/Cloud',
  },
  {
    id: 'mckinsey',
    name: 'McKinsey',
    url: 'https://www.mckinsey.com/rss/rssnews?channel=technology',
    icon: Briefcase,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    tag: 'Strategy',
  },
];

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const stripHtml = (html) => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || '';
  return text.slice(0, 200) + (text.length > 200 ? '...' : '');
};

const NewsItem = ({ item, source, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex gap-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-300"
    >
      {/* Source Icon */}
      <div className={`hidden sm:flex w-10 h-10 ${source.bgColor} rounded-lg items-center justify-center flex-shrink-0 ${source.color}`}>
        <source.icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Source + Time */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className={`${source.color} font-medium`}>{source.name}</span>
          <span>•</span>
          <span>{formatDate(item.pubDate || item.published || item.date)}</span>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-gray-200 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {item.title}
        </h4>

        {/* Excerpt */}
        {isHovered && item.description && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
            {stripHtml(item.description)}
          </p>
        )}
      </div>

      <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0 self-center group-hover:text-blue-400 transition-colors" />
    </motion.a>
  );
};

const NewsSection = () => {
  const [news, setNews] = useState([]);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const allNews = [];

      // Fetch from all sources in parallel
      const promises = NEWS_SOURCES.map(async (source) => {
        try {
          const response = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`
          );
          const data = await response.json();

          if (data.status === 'ok') {
            return data.items.slice(0, 3).map((item) => ({
              ...item,
              source,
            }));
          }
        } catch (err) {
          console.warn(`Failed to fetch ${source.name}:`, err);
          return [];
        }
      });

      const results = await Promise.all(promises);

      // Flatten and sort by date
      results.flat().forEach((item) => {
        if (item.title && item.link) {
          allNews.push(item);
        }
      });

      // Sort by date (newest first)
      allNews.sort((a, b) => {
        const dateA = new Date(a.pubDate || a.published || a.date || 0);
        const dateB = new Date(b.pubDate || b.published || b.date || 0);
        return dateB - dateA;
      });

      setNews(allNews.slice(0, 10));
    } catch (err) {
      setError('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <Section
      id="news"
      title="Industry News"
      subtitle="Staying current with AI, cloud, and technology trends"
    >
      {/* Refresh Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => startTransition(() => fetchNews())}
          disabled={isPending}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchNews}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 p-4 bg-zinc-900/50 rounded-xl">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-zinc-800 rounded w-1/4 mb-2" />
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          {news.map((item, index) => (
            <NewsItem key={`${item.source.id}-${index}`} item={item} source={item.source} index={index} />
          ))}
        </div>
      )}

      {/* Sources Footer */}
      <div className="mt-8 pt-6 border-t border-zinc-800/50">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
          <span>Sources:</span>
          {NEWS_SOURCES.map((source) => (
            <a
              key={source.id}
              href={source.url.replace('/feed/', '/').replace('?alt=rss', '')}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1 ${source.color} hover:underline`}
            >
              <Globe className="w-3 h-3" />
              {source.name}
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default NewsSection;
