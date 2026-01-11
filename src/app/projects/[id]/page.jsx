'use client';

import { useParams } from 'next/navigation';
import { caseStudies } from '../../data/caseStudies';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Github, CheckCircle, Target, Zap, BarChart3, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const ProjectDetailPage = () => {
  const params = useParams();
  const projectId = params.id;
  const project = caseStudies.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Project Not Found</h1>
          <Link href="/#projects" className="text-blue-400 hover:text-blue-300">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Case Studies
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              project.status === 'Production'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {project.status}
            </span>
            <span className="text-gray-500 text-sm">{project.category}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {project.title}
          </h1>
          <p className="text-xl text-gray-400 mb-6">{project.tagline}</p>

          <div className="flex flex-wrap gap-4">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Live Demo
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors"
              >
                <Github className="w-4 h-4" />
                View Code
              </a>
            )}
          </div>
        </motion.div>

        {/* Problem Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Problem Statement</h2>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-2xl p-6 md:p-8 border border-zinc-800/50">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Context</h3>
                <p className="text-gray-400 leading-relaxed">
                  {project.problem.context}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">User Impact</h3>
                <p className="text-gray-400 leading-relaxed">
                  {project.problem.userImpact}
                </p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-zinc-800/50">
              <h3 className="text-lg font-semibold text-white mb-3">Scope</h3>
              <p className="text-gray-400 leading-relaxed">
                {project.problem.scope}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Solution Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold text-white">Solution Overview</h2>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-2xl p-6 md:p-8 border border-zinc-800/50 mb-6">
            <p className="text-gray-400 leading-relaxed text-lg">
              {project.solution.overview}
            </p>
          </div>

          {/* Workflow */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.solution.workflow.map((step) => (
              <div
                key={step.step}
                className="bg-gradient-to-br from-zinc-900/60 to-zinc-800/30 rounded-xl p-5 border border-zinc-800/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {step.step}
                  </span>
                  <h3 className="font-semibold text-white">{step.name}</h3>
                </div>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Architecture Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Architecture</h2>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-2xl p-6 md:p-8 border border-zinc-800/50">
            <div className="mb-6">
              <span className="text-sm text-gray-500">Design Pattern:</span>
              <span className="ml-2 text-white font-medium">{project.architecture.pattern}</span>
            </div>

            {/* Architecture Diagram Placeholder */}
            <div className="bg-zinc-800/50 rounded-xl p-8 mb-6">
              <div className="text-center text-gray-500 mb-4">
                System Architecture Diagram
              </div>
              <div className="font-mono text-xs text-gray-400 overflow-x-auto">
                {project.architecture.dataFlow}
              </div>
            </div>

            {/* Components */}
            <div className="grid gap-4 md:grid-cols-2">
              {project.architecture.components.map((comp) => (
                <div key={comp.name} className="bg-zinc-800/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">{comp.name}</h4>
                    <span className="text-xs text-gray-500">{comp.role}</span>
                  </div>
                  <p className="text-sm text-gray-400">{comp.tech}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Results Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Results & Impact</h2>
          </div>

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {project.results.metrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-xl p-5 border border-zinc-800/50 text-center"
              >
                <div className="text-xs text-gray-500 mb-2">{metric.label}</div>
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-xs text-green-400">{metric.improvement}</div>
                {metric.baseline !== 'baseline' && (
                  <div className="text-xs text-gray-500 mt-1">vs {metric.baseline}</div>
                )}
              </div>
            ))}
          </div>

          {/* Outcomes */}
          <div className="bg-gradient-to-br from-green-900/20 to-zinc-900/50 rounded-2xl p-6 md:p-8 border border-green-500/20">
            <h3 className="text-lg font-semibold text-white mb-4">Key Outcomes</h3>
            <ul className="space-y-3">
              {project.results.outcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Edge Cases Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Edge Cases & Tradeoffs</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {project.edgeCases.map((edgeCase, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-xl p-5 border border-zinc-800/50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">{edgeCase.issue}</h4>
                    <p className="text-sm text-gray-400">
                      <span className="text-gray-500">Handling: </span>
                      {edgeCase.handling}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Tech Stack</h2>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 rounded-2xl p-6 md:p-8 border border-zinc-800/50">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(project.techStack).map(([category, techs]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {techs.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-zinc-800 text-gray-300 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Future Roadmap */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Future Roadmap</h2>
          </div>

          <div className="bg-gradient-to-br from-blue-900/20 to-zinc-900/50 rounded-2xl p-6 md:p-8 border border-blue-500/20">
            <ul className="space-y-3">
              {project.roadmap.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
