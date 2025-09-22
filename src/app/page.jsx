"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const me = '/images/me.svg';
import { Footer } from './component/footer';
import { spaceGrotesk } from './fonts';
import { getTopRepositories } from '../lib/github.js';
import { useAsync } from '../hooks/useAsync';
import LazySection from './components/LazySection';
import ProjectCard from './components/ProjectCard';

const Chatbot = dynamic(() => import('./component/chatbot/chatbot'), { ssr: false, loading: () => null });
const ModernGridBackground = dynamic(() => import('./component/chatbot/ModernGridBackground'), { ssr: false, loading: () => null });
const FiverrPricing = dynamic(() => import('./component/pricing/FiverrPricing').then(mod => mod.FiverrPricing), { ssr: false, loading: () => null });
const UpworkPricing = dynamic(() => import('./component/pricing/UpworkPricing').then(mod => mod.UpworkPricing), { ssr: false, loading: () => null });

const SectionTitle = ({ title, subtitle, className = '' }) => (
  <div className={`text-center mb-4 sm:mb-6 ${className}`}>
    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">{title}</h2>
    {subtitle && <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">{subtitle}</p>}
  </div>
);

const LoadingAnimation = () => (
  <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full"></div>
  </div>
);

// Utility section
const Section = ({ id, title, children }) => (
  <section id={id} className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
    <SectionTitle title={title} />
    {children}
  </section>
);

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('starter');
  const { data: projects, loading: projectsLoading, error } = useAsync(() => getTopRepositories(6), []);
  const [expandedReadmes, setExpandedReadmes] = useState({});
  const [readmeCache, setReadmeCache] = useState({});

  const toggleReadme = useCallback(async (projectId) => {
    const isExpanding = !expandedReadmes[projectId];
    setExpandedReadmes(prev => ({ ...prev, [projectId]: isExpanding }));
    
    if (isExpanding && !readmeCache[projectId]) {
      const project = projects?.find(p => p.id === projectId);
      if (project?.name) {
        try {
          const { getReadme } = await import('../lib/github.js');
          const readme = await getReadme(project.name);
          setReadmeCache(prev => ({ ...prev, [projectId]: readme }));
        } catch (error) {
          console.error('Error loading README:', error);
          setReadmeCache(prev => ({ ...prev, [projectId]: 'Error loading README' }));
        }
      }
    }
  }, [expandedReadmes, readmeCache, projects]);

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleResize = () => window.innerWidth >= 768 && setMobileMenuOpen(false);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const Navbar = () => {
    return (
      <>
        <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className={`font-bold text-base sm:text-lg bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent ${spaceGrotesk.className}`}>
              Aparna_Pradhan.Dev
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              {['Projects', 'Blogs', 'Pricing', 'Contact'].map((item) => (
                <a key={item} href={item === 'Blogs' ? 'https://aparnap2.github.io/Aparna-Pradhan-blogs' : `#${item.toLowerCase()}`} 
                   className="text-gray-300 hover:text-orange-400 px-3 py-2 text-sm">
                  {item}
                </a>
              ))}
              <a href="#contact" className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded text-sm font-medium">
                Hire Me
              </a>
            </div>

            <button className="md:hidden p-2 text-gray-400" onClick={toggleMobileMenu}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
              </svg>
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 pt-16 bg-black/90 md:hidden" onClick={closeMobileMenu}>
            <div className="bg-gray-900 p-4">
              <div className="flex flex-col space-y-3">
                {['Projects', 'Blogs', 'Pricing', 'Contact'].map((item) => (
                  <a key={item} href={item === 'Blogs' ? 'https://aparnap2.github.io/Aparna-Pradhan-blogs' : `#${item.toLowerCase()}`} 
                     className="text-gray-300 py-3 px-4 rounded hover:bg-gray-800" onClick={closeMobileMenu}>
                    {item}
                  </a>
                ))}
                <a href="#contact" className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-4 rounded text-center font-medium" onClick={closeMobileMenu}>
                  Hire Me
                </a>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };



  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      
      <Navbar />
      
      <div className="pt-16">
        {/* Modern Grid Background */}
        <div className="fixed inset-0 -z-10">
          <ModernGridBackground />
        </div>
        
        {/* Overlay for better text readability - more transparent to show grid */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-gray-900/70 via-gray-900/30 to-gray-900/70" />

        {/* Hero Section */}
        <header className="px-4 py-8 max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center space-y-6 lg:flex-row lg:text-left lg:space-y-0 lg:space-x-8">
            <div className="flex-1 space-y-4">
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent ${spaceGrotesk.className}`}>
                Autonomous AI Agents that Scale Your Business 24/7
              </h1>
              <p className="text-base sm:text-lg text-orange-300 font-medium">
                Production-grade AI agents that solve real business problems without human hand-holding
              </p>
              <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-200">
                <p>I build LangGraph-powered AI systems with generative UI that handle customer support, operations, and data workflows end-to-end—secure, predictable, and measurable.</p>
                <p className="mt-2 text-purple-300">Code-first • Typed data flows • Secure by design • Cross-platform integrations</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: '🤖', title: 'LangGraph Orchestration', desc: 'Multi-agent workflows' },
                  { icon: '⚡', title: 'Generative UI', desc: 'Dynamic interfaces' },
                  { icon: '🔒', title: 'Secure & Typed', desc: 'Production-grade' }
                ].map((item, i) => (
                  <div key={i} className="bg-gray-800/30 rounded p-3 border border-gray-700/30">
                    <div className="text-lg mb-1">{item.icon}</div>
                    <h3 className="text-white font-medium text-xs mb-1">{item.title}</h3>
                    <p className="text-gray-300 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#contact" className="bg-gradient-to-r from-orange-400 to-orange-500 text-black px-6 py-3 rounded-lg font-bold text-sm">
                  Book Architecture Review
                </a>
                <a href="#pricing" className="border-2 border-orange-400 text-orange-400 px-6 py-3 rounded-lg font-bold text-sm">
                  See Live Demos
                </a>
              </div>
            </div>
            <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full border-2 border-purple-400 overflow-hidden flex-shrink-0">
              <Image src={me} alt="Aparna Pradhan" width={192} height={192} className="object-cover w-full h-full" priority />
            </div>
          </div>
        </header>

        {/* Projects Section */}
        <LazySection fallback={<div className="h-48 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"></div></div>}>
          <Section id="projects" title="Success Stories">
            <div className="max-w-6xl mx-auto">
              <p className="text-center text-gray-300 mb-8">Autonomous AI systems across domains</p>
              {projectsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full mx-auto"></div>
                </div>
              )}
              {error && <div className="text-center py-8"><p className="text-red-500 text-sm">{error}</p></div>}
              {projects?.length > 0 && (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} onToggleReadme={toggleReadme} expandedReadmes={expandedReadmes} readmeCache={readmeCache} />
                  ))}
                </div>
              )}
            </div>
          </Section>
        </LazySection>

        <Section id="pricing" title="Core Services">
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-lg text-gray-300 mb-4">
                Production-grade AI agents across business domains
              </p>
              <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Why My Pricing Is Different</h3>
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <p className="text-red-400 mb-2">❌ Chat widgets that just talk</p>
                    <p className="text-red-400 mb-2">❌ Black-box AI with no control</p>
                    <p className="text-red-400">❌ Enterprise bloat and lock-in</p>
                  </div>
                  <div>
                    <p className="text-green-400 mb-2">✅ Agents that do the work</p>
                    <p className="text-green-400 mb-2">✅ Code-first, typed, secure</p>
                    <p className="text-green-400">✅ Your team can extend and own</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-lg border border-zinc-700">
                <h3 className="text-lg font-bold text-orange-400 mb-2 text-center">Starter</h3>
                <p className="text-center text-orange-400 text-base font-semibold mb-3">$1,500 - $3,500</p>
                <div className="space-y-6 text-sm">
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Single-Agent Workflow</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• 1-2 integrations, basic generative UI</li>
                      <li>• Customer support or ops automation</li>
                      <li>• Proof-of-value with real data</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Testing AI automation potential</p>
                  </div>
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Autonomous Support Agent</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Ticket triage, order handling, account updates</li>
                      <li>• Knowledge search, proactive notifications</li>
                      <li>• 60-80% cost reduction, &lt;2s responses</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> E-commerce and service businesses</p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Data & Knowledge Copilot</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Secure NL → SQL assistants, RAG retrieval</li>
                      <li>• Report generation, KPI digests</li>
                      <li>• Time-to-insight in minutes</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Data-driven decision making</p>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-lg border border-orange-500 relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-black px-2 py-1 rounded text-xs font-bold">
                  Popular
                </div>
                <h3 className="text-lg font-bold text-orange-400 mb-2 text-center">Pro</h3>
                <p className="text-center text-orange-400 text-base font-semibold mb-3">$4,000 - $9,000</p>
                <div className="space-y-6 text-sm">
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Multi-Step Orchestration</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• 3-5 integrations, analytics dashboard</li>
                      <li>• Support or ops automation with KPIs</li>
                      <li>• Monitoring and performance tracking</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Measurable business automation</p>
                  </div>
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Ops & Workflow Automation</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Intake → decisioning → action flows</li>
                      <li>• HR/IT/Logistics with exception handling</li>
                      <li>• Faster cycle times, fewer manual touches</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Operations optimization</p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">AI Transformation Sprint</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• 2-3 week sprint, highest-ROI automations</li>
                      <li>• Architecture, risk model, metrics</li>
                      <li>• Production-ready prototype delivery</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Strategic AI implementation</p>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-800/50 p-3 sm:p-4 rounded-lg border border-zinc-700">
                <h3 className="text-lg font-bold text-orange-400 mb-2 text-center">Enterprise</h3>
                <p className="text-center text-orange-400 text-base font-semibold mb-3">$10,000 - $25,000+</p>
                <div className="space-y-6 text-sm">
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Multi-Agent Systems</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Advanced guardrails, custom models</li>
                      <li>• White-label deployment, SSO integration</li>
                      <li>• Mission-critical process automation</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Enterprise-scale operations</p>
                  </div>
                  <div className="border-b border-gray-700 pb-4">
                    <h4 className="text-white font-semibold mb-2">Cross-Domain Integration</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Support, ops, HR/IT helpdesk, sales ops</li>
                      <li>• Unified AI across business functions</li>
                      <li>• Comprehensive automation strategy</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Full business transformation</p>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Custom Architecture</h4>
                    <ul className="text-gray-300 space-y-1 mb-2">
                      <li>• Bespoke AI for unique business models</li>
                      <li>• Advanced enterprise system integrations</li>
                      <li>• Full ownership and extensibility</li>
                    </ul>
                    <p className="text-purple-300 text-xs"><strong>Perfect for:</strong> Complex, unique requirements</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/10 to-purple-600/10 rounded-xl p-6 border border-orange-500/20">
              <h3 className="text-xl font-bold text-white text-center mb-4">Return on Investment</h3>
              <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-orange-400 font-semibold">70-95% autonomous resolution</p>
                  <p className="text-green-400">Across all business domains</p>
                </div>
                <div>
                  <p className="text-orange-400 font-semibold">Response time: &lt;2s</p>
                  <p className="text-green-400">With streaming generative UI</p>
                </div>
                <div>
                  <p className="text-purple-400 font-semibold">Measured ROI:</p>
                  <p className="text-white text-lg font-bold">Weeks not months</p>
                </div>
              </div>
            </div>
        </div>
        </Section>

        <Section id="process" title="How It Works">
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { num: '1', title: 'Discovery & ROI', desc: 'Identify highest-impact workflows and constraints' },
              { num: '2', title: 'Blueprint & Guardrails', desc: 'Define agent graph, tool contracts, data schemas, safety rails' },
              { num: '3', title: 'Build & Integrate', desc: 'LangGraph flows, generative UI, tool adapters, monitoring' },
              { num: '4', title: 'Prove & Scale', desc: 'Measure deflection, response time, satisfaction; extend workflows' }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-sm">{step.num}</span>
                </div>
                <h4 className="text-white font-semibold mb-2 text-sm">{step.title}</h4>
                <p className="text-gray-300 text-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
        </Section>

        <Section id="platforms" title="Available on Your Favorite Platforms">
        <div className="max-w-5xl mx-auto space-y-16">
          <FiverrPricing />
          <UpworkPricing />
        </div>
        </Section>

        <Section id="faq" title="Frequently Asked Questions">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">What if I don&apos;t like the result?</h3>
                <p className="text-gray-300">Full refund if the automation doesn&apos;t work exactly as promised. Plus you keep any code I&apos;ve written.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">How is this different from Zapier or other tools?</h3>
                <p className="text-gray-300">I write custom code that you own forever. No monthly subscriptions, no limitations, faster performance, and it won&apos;t break when platforms change.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">What if you disappear or stop supporting it?</h3>
                <p className="text-gray-300">You get all the source code. Any developer can maintain it, or I can train someone on your team. You&apos;re never locked in.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">How do I know if my business needs automation?</h3>
                <p className="text-gray-300">If you spend more than 30 minutes daily on repetitive computer tasks (email sorting, data entry, answering the same questions), automation typically pays for itself within a month.</p>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">Do you work with big companies?</h3>
                <p className="text-gray-300">I specialize in small businesses and solopreneurs. Big companies have different needs - I focus on solutions that work perfectly for smaller teams.</p>
              </div>
            </div>
          </div>
          </Section>

        <Section id="contact" title="Let&apos;s build your AI-powered solution">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-lg text-gray-300 mb-8">
              Ready to deploy autonomous agents that actually do the work? Let&apos;s discuss your specific automation needs.
            </p>
            <div className="bg-zinc-800/50 p-8 rounded-xl border border-zinc-700">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Ready for autonomous AI agents?</h3>
              <p className="text-gray-300 mb-6">
                Get a custom architecture review and see how LangGraph-powered agents can transform your business operations.
              </p>
              <div className="text-sm text-gray-400">
                <div className="text-sm text-gray-400">
                💡 This chatbot uses the same AI technology I&apos;ll build for your business automation
              </div>
              </div>
            </div>
          </div>
          </Section>
        <Footer />
        <Chatbot />
      </div>
    </div>
  );
}
