'use client';

import { ArrowLeft, FileText, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function BlogPage() {
  const posts = [
    {
      title: 'How I Built a Self-Healing Supply Chain AI with LangGraph',
      excerpt: 'A deep dive into building multi-agent systems that detect disruptions and auto-execute recovery workflows.',
      date: 'January 2026',
      readTime: '8 min read',
      link: 'https://medium.com/@ap3617180',
      tags: ['LangGraph', 'Multi-Agent', 'Production']
    },
    {
      title: 'Reducing LLM Costs by 60%: A Production Case Study',
      excerpt: 'How I switched from GPT-4 to DeepSeek and maintained quality while cutting inference costs significantly.',
      date: 'January 2026',
      readTime: '6 min read',
      link: 'https://medium.com/@ap3617180',
      tags: ['Cost Optimization', 'LLM', 'DeepSeek']
    },
    {
      title: 'Building Production-Grade OCR Pipelines with Docling',
      excerpt: 'Lessons learned from achieving 95% accuracy on unstructured logistics documents.',
      date: 'December 2025',
      readTime: '7 min read',
      link: 'https://medium.com/@ap3617180',
      tags: ['OCR', 'Docling', 'Production']
    },
  ];

  return (
    <div className="blog-page">
      <nav className="navbar">
        <div className="container navbar-content">
          <Link href="/" className="navbar-logo">
            Aparna<span className="text-accent">.Dev</span>
          </Link>
          <Link href="/#contact" className="btn btn-primary btn-sm">
            Let&apos;s Talk
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <div className="container" style={{ maxWidth: '800px' }}>
          <Link
            href="/#projects"
            className="inline-flex items-center gap-2 text-tertiary hover:text-primary mb-8 transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            Back to Projects
          </Link>

          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              Technical Writing
            </h1>
            <p className="text-xl text-secondary" style={{ maxWidth: '600px' }}>
              Thoughts on building agentic AI systems, production engineering, and lessons learned from shipping.
            </p>
          </header>

          {/* Blog Posts */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <article key={index} className="card p-6 hover:border-accent transition-colors">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-primary mb-3">
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent transition-colors"
                      >
                        {post.title}
                      </a>
                    </h2>
                    <p className="text-secondary mb-4">{post.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-tertiary mb-4">
                      <span className="flex items-center gap-1">
                        <Clock size={14} strokeWidth={2} />
                        {post.date}
                      </span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-elevated text-tertiary text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover transition-colors p-2"
                    aria-label="Read article"
                  >
                    <ExternalLink size={20} strokeWidth={2} />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* More Coming Soon */}
          <div className="mt-12 card p-8 text-center bg-elevated border-dashed">
            <FileText size={32} strokeWidth={2} className="text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">More Posts Coming Soon</h3>
            <p className="text-secondary text-sm">
              I publish new technical articles regularly. Follow me on Medium to get notified when I post.
            </p>
            <a
              href="https://medium.com/@ap3617180"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary mt-4"
            >
              Follow on Medium
            </a>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-8 card p-6 bg-accent-dim border-accent text-center">
            <h3 className="font-semibold text-primary mb-2">Have a topic you&apos;d like me to write about?</h3>
            <p className="text-secondary text-sm mb-4">
              I&apos;m always looking for new challenges and topics to explore. Let me know what you&apos;re curious about.
            </p>
            <a href="mailto:ap3617180@gmail.com" className="btn btn-primary btn-sm">
              Suggest a Topic
            </a>
          </div>
        </div>
      </main>

      <style jsx>{`
        .blog-page { min-height: 100vh; background: var(--color-bg-primary); }
        .pt-24 { padding-top: 6rem; }
        .pb-20 { padding-bottom: 5rem; }
      `}</style>
    </div>
  );
}
