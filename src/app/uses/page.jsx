'use client';

import { ArrowLeft, Terminal, Database, Cloud, Monitor, Cpu, Code2, Layout, MousePointer2, Zap } from 'lucide-react';
import Link from 'next/link';

export default function UsesPage() {
  const categories = [
    {
      icon: <Code2 size={24} strokeWidth={2} />,
      title: 'Languages',
      items: [
        'Python (primary)',
        'JavaScript/TypeScript',
        'SQL',
        'Bash/Shell',
      ]
    },
    {
      icon: <Cpu size={24} strokeWidth={2} />,
      title: 'AI & ML',
      items: [
        'LangGraph (orchestration)',
        'PydanticAI (structured LLM)',
        'Docling (OCR)',
        'ChromaDB (vector store)',
        'NetworkX (algorithms)',
      ]
    },
    {
      icon: <Terminal size={24} strokeWidth={2} />,
      title: 'Backend',
      items: [
        'Django (REST API)',
        'FastAPI',
        'Node.js',
        'PostgreSQL',
      ]
    },
    {
      icon: <Monitor size={24} strokeWidth={2} />,
      title: 'Frontend',
      items: [
        'Next.js 14',
        'React 18',
        'Tailwind CSS',
        'Framer Motion',
      ]
    },
    {
      icon: <Cloud size={24} strokeWidth={2} />,
      title: 'Infrastructure',
      items: [
        'Modal (serverless)',
        'Railway (hosting)',
        'Docker',
        'GitHub Actions',
      ]
    },
    {
      icon: <Layout size={24} strokeWidth={2} />,
      title: 'Editor & Tools',
      items: [
        'VS Code',
        'Cursor (AI-powered)',
        'Git',
        'PostgreSQL/Supabase',
      ]
    },
    {
      icon: <MousePointer2 size={24} strokeWidth={2} />,
      title: 'Productivity',
      items: [
        'Notion (docs)',
        'Slack (communication)',
        'Loom (demos)',
      ]
    },
  ];

  return (
    <div className="uses-page">
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
              Uses
            </h1>
            <p className="text-xl text-secondary" style={{ maxWidth: '600px' }}>
              The tools and technologies I use to build AI agents and production systems.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <div key={category.title} className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-accent-dim text-accent">
                    {category.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-primary">{category.title}</h2>
                </div>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li key={item} className="text-secondary text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <section className="mt-12 card p-6 bg-accent-dim border-accent">
            <div className="flex items-start gap-4">
              <Zap size={24} strokeWidth={2} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary mb-2">Why Cursor?</h3>
                <p className="text-secondary text-sm">
                  I use Cursor instead of vanilla VS Code. The AI-powered autocomplete and chat features help me prototype faster and understand complex codebases quickly. It&apos;s especially useful when working with LangGraph workflows and debugging multi-agent systems.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx>{`
        .uses-page { min-height: 100vh; background: var(--color-bg-primary); }
        .pt-24 { padding-top: 6rem; }
        .pb-20 { padding-bottom: 5rem; }
      `}</style>
    </div>
  );
}
