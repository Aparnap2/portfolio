"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Mail,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Opportunity {
  id: string;
  name: string;
  problemStatement: string;
  solutionDescription: string;
  category: string;
  difficulty: "low" | "medium" | "high";
  hoursSavedPerMonth: number;
  monthlySavings: number;
  devCostMid: number;
  implementationWeeks: number;
  breakevenMonths: number;
  roi12Months: number;
  matchScore: number;
  rank: number;
}

interface Roadmap {
  totalDuration: string;
  totalInvestment: string;
  totalMonthlySavings: string;
  overallROI: string;
  phases: Array<{
    phase: number;
    name: string;
    startWeek: number;
    endWeek: number;
    duration: string;
    deliverables: string[];
    milestones: Array<{ week: number; title: string }>;
    expectedROI: string;
    monthlySavings: string;
  }>;
  quickWins: string[];
  bigSwings: string[];
}

interface AuditReportViewerProps {
  sessionId: string;
  opportunities: Opportunity[];
  roadmap: Roadmap;
  painScore: number;
  estimatedValue: number;
  contactInfo?: {
    name: string;
    email: string;
    company: string;
  };
}

export function AuditReportViewer({
  sessionId,
  opportunities,
  roadmap,
  painScore,
  estimatedValue,
  contactInfo
}: AuditReportViewerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "opportunities" | "roadmap">("overview");
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleEmailReport = async () => {
    try {
      const response = await fetch("/api/audit/report/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          opportunities,
          roadmap,
          painScore,
          estimatedValue,
          contactInfo,
        }),
      });

      if (response.ok) {
        setIsEmailSent(true);
        setTimeout(() => setIsEmailSent(false), 3000);
      }
    } catch (error) {
      console.error("Failed to email report:", error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "low": return "text-green-400 bg-green-400/10";
      case "medium": return "text-yellow-400 bg-yellow-400/10";
      case "high": return "text-red-400 bg-red-400/10";
      default: return "text-gray-400 bg-gray-400/10";
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Your AI Opportunity Report
            </h1>
          </div>
          <p className="text-neutral-400 text-lg">
            Personalized automation opportunities for {contactInfo?.company || "your business"}
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold text-purple-400">{painScore}/100</span>
            </div>
            <p className="text-neutral-400 text-sm">Pain Score</p>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className="text-2xl font-bold text-green-400">${estimatedValue.toLocaleString()}</span>
            </div>
            <p className="text-neutral-400 text-sm">Estimated Value</p>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold text-yellow-400">{opportunities.length}</span>
            </div>
            <p className="text-neutral-400 text-sm">Opportunities</p>
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{roadmap.overallROI}</span>
            </div>
            <p className="text-neutral-400 text-sm">Overall ROI</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex space-x-1 mb-8 bg-neutral-900 border border-neutral-800 rounded-xl p-1"
        >
          {(["overview", "opportunities", "roadmap"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg font-medium transition-all",
                activeTab === tab
                  ? "bg-purple-600 text-white"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Summary */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Shield className="w-6 h-6 text-purple-400 mr-3" />
                  Executive Summary
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-neutral-300 leading-relaxed mb-4">
                    Based on our analysis, we've identified {opportunities.length} key automation opportunities 
                    that could save your team approximately {opportunities.reduce((sum, opp) => sum + opp.hoursSavedPerMonth, 0)} hours per month.
                  </p>
                  <p className="text-neutral-300 leading-relaxed mb-4">
                    With a pain score of {painScore}/100, there's significant room for improvement in your current workflows. 
                    The recommended implementations could deliver an estimated ROI of {roadmap.overallROI} within the first year.
                  </p>
                  <p className="text-neutral-300 leading-relaxed">
                    Total investment required: <span className="text-green-400 font-bold">{roadmap.totalInvestment}</span>
                    <br />
                    Expected monthly savings: <span className="text-green-400 font-bold">{roadmap.totalMonthlySavings}</span>
                    <br />
                    Payback period: <span className="text-green-400 font-bold">{roadmap.totalDuration}</span>
                  </p>
                </div>
              </div>

              {/* Quick Wins */}
              {roadmap.quickWins.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                    Quick Wins (Low Effort, High Impact)
                  </h3>
                  <ul className="space-y-2">
                    {roadmap.quickWins.map((win, index) => (
                      <li key={index} className="flex items-center text-neutral-300">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        {win}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "opportunities" && (
            <motion.div
              key="opportunities"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {opportunities.map((opportunity, index) => (
                <motion.div
                  key={opportunity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-8"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl font-bold text-purple-400 mr-3">#{opportunity.rank}</span>
                        <h3 className="text-xl font-bold">{opportunity.name}</h3>
                      </div>
                      <div className="flex items-center space-x-4 mb-4">
                        <span className={cn("px-3 py-1 rounded-full text-sm font-medium", getDifficultyColor(opportunity.difficulty))}>
                          {opportunity.difficulty} difficulty
                        </span>
                        <span className={cn("text-sm font-medium", getMatchScoreColor(opportunity.matchScore))}>
                          {opportunity.matchScore}% match
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-neutral-400 text-sm mb-1">Monthly Savings</p>
                      <p className="text-2xl font-bold text-green-400">${opportunity.monthlySavings.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-sm mb-1">Implementation</p>
                      <p className="text-2xl font-bold text-blue-400">{opportunity.implementationWeeks} weeks</p>
                    </div>
                    <div>
                      <p className="text-neutral-400 text-sm mb-1">12-Month ROI</p>
                      <p className="text-2xl font-bold text-purple-400">{opportunity.roi12Months}%</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Problem Statement</h4>
                      <p className="text-neutral-300">{opportunity.problemStatement}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-2">Solution</h4>
                      <p className="text-neutral-300">{opportunity.solutionDescription}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "roadmap" && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Calendar className="w-6 h-6 text-purple-400 mr-3" />
                  Implementation Roadmap
                </h2>
                
                <div className="space-y-6">
                  {roadmap.phases.map((phase, index) => (
                    <motion.div
                      key={phase.phase}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      {index < roadmap.phases.length - 1 && (
                        <div className="absolute left-4 top-12 w-0.5 h-full bg-neutral-700" />
                      )}
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold">{phase.phase}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-2">{phase.name}</h3>
                          <p className="text-neutral-400 mb-4">
                            Duration: {phase.duration} • ROI: {phase.expectedROI} • Savings: {phase.monthlySavings}
                          </p>
                          <div className="bg-neutral-800 rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Key Deliverables:</h4>
                            <ul className="space-y-1 text-sm text-neutral-300">
                              {phase.deliverables.map((deliverable, i) => (
                                <li key={i} className="flex items-center">
                                  <CheckCircle className="w-3 h-3 text-green-400 mr-2" />
                                  {deliverable}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mt-12"
        >
          <button
            onClick={handleEmailReport}
            className={cn(
              "flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all",
              isEmailSent
                ? "bg-green-600 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            )}
          >
            {isEmailSent ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Email Sent!
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Email Report
              </>
            )}
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-all"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </button>
          
          <a
            href={`mailto:aparna@aparnapradhanportfolio.com?subject=AI Audit Follow-up - ${contactInfo?.company}&body=Hi Aparna,%0D%0A%0D%0AI've completed my AI audit and would like to discuss the opportunities.%0D%0A%0D%0ASession ID: ${sessionId}`}
            className="flex items-center justify-center px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-medium transition-all"
          >
            Schedule Consultation
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}