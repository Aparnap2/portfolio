'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, BookOpen, Calendar, ArrowRight } from 'lucide-react';

const MEDIUM_RSS_URL = 'https://medium.com/feed/@ap3617180';

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const stripHtml = (html) => {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '');
  return text.slice(0, 180) + (text.length > 180 ? '...' : '');
};

const MediumBlogs = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setError(null);
      try {
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(MEDIUM_RSS_URL)}`
        );
        const data = await response.json();

        if (data.status === 'ok') {
          const formattedPosts = data.items.slice(0, 6).map((item) => ({
            title: item.title,
            link: item.link,
            published: new Date(item.pubDate).getTime(),
            description: item.description || '',
            categories: item.categories || [],
            thumbnail: item.thumbnail || item.enclosure?.link,
          }));
          setPosts(formattedPosts);
        } else {
          setError('Failed to load blog posts');
        }
      } catch (err) {
        setError('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="blog-loading">
        <div className="loading-spinner" />
        <span>Loading articles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-error">
        <p>{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <a
          key={post.link}
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          className="blog-card"
        >
          {post.thumbnail && (
            <div className="blog-card-image">
              <img src={post.thumbnail} alt={post.title} loading="lazy" />
              <div className="blog-card-overlay">
                <ExternalLink size={20} />
              </div>
            </div>
          )}

          <div className="blog-card-content">
            {post.categories.length > 0 && (
              <div className="blog-card-categories">
                {post.categories.slice(0, 2).map((cat) => (
                  <span key={cat} className="blog-category">{cat}</span>
                ))}
              </div>
            )}

            <h3 className="blog-card-title">{post.title}</h3>
            <p className="blog-card-excerpt">{stripHtml(post.description)}</p>

            <div className="blog-card-meta">
              <span className="blog-card-date">
                <Calendar size={14} />
                {formatDate(post.published)}
              </span>
              <span className="blog-card-read">
                Read article
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </a>
      ))}

      <a href="https://medium.com/@ap3617180" target="_blank" rel="noopener noreferrer" className="blog-view-all">
        <BookOpen size={24} />
        <span>View all articles on Medium</span>
        <ExternalLink size={18} />
      </a>
    </div>
  );
};

export default MediumBlogs;
