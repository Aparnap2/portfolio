"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuditReportViewer } from "@/components/audit/AuditReportViewer";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";

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

interface AuditSession {
  sessionId: string;
  painScore: number;
  estimatedValue: number;
  name?: string;
  email?: string;
  company?: string;
  status: string;
  opportunities: Opportunity[];
  roadmap: Roadmap;
}

export default function AuditReportPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [auditData, setAuditData] = useState<AuditSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchAuditData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/audit/report/${sessionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Audit report not found. The session may have expired or doesn't exist.");
          } else {
            setError("Failed to load audit report. Please try again.");
          }
          return;
        }

        const data = await response.json();
        
        if (data.success) {
          setAuditData(data.auditSession);
        } else {
          setError(data.error || "Failed to load audit report");
        }
      } catch (err) {
        console.error("Error fetching audit data:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, [sessionId]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error || !auditData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Report Not Available</h1>
          <p className="text-neutral-400 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center justify-center w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          <div className="mt-6 pt-6 border-t border-neutral-800">
            <p className="text-neutral-500 text-sm mb-2">
              If the problem persists, please contact support:
            </p>
            <a
              href="mailto:aparna@aparnapradhanportfolio.com?subject=Audit Report Issue - Session ${sessionId}"
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              aparna@aparnapradhanportfolio.com
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // Check if audit is completed
  if (auditData.status !== "completed") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Audit In Progress</h1>
          <p className="text-neutral-400 mb-6">
            This audit session is still in progress. Please complete the assessment to view your report.
          </p>
          <a
            href="/audit"
            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
          >
            Continue Audit
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <AuditReportViewer
      sessionId={auditData.sessionId}
      opportunities={auditData.opportunities}
      roadmap={auditData.roadmap}
      painScore={auditData.painScore}
      estimatedValue={auditData.estimatedValue}
      contactInfo={{
        name: auditData.name || "",
        email: auditData.email || "",
        company: auditData.company || "",
      }}
    />
  );
}