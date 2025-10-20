// Shared types mirroring PRD models (simplified)

export type Phase =
  | "discovery"
  | "pain_points"
  | "validation"
  | "matching"
  | "report_generation"
  | "notifications"
  | "completed";

export interface AuditSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  currentPhase: Phase;
  completionPercent: number;
  // Phase 1
  industry?: string | null;
  companySize?: string | null;
  currentSystems?: Record<string, string> | null;
  acquisitionFlow?: string | null;
  deliveryFlow?: string | null;
  supportFlow?: string | null;
  // Phase 2
  manualTasks?: string[] | null;
  hoursPerWeek?: number | null;
  avgHourlyRate?: number | null;
  decisionBottlenecks?: string | null;
  dataSilos?: string | null;
  visibilityGaps?: string | null;
  // Phase 3
  budgetRange?: string | null;
  timeline?: string | null;
  userRole?: string | null;
  name?: string | null;
  email?: string | null;
  company?: string | null;
  phone?: string | null;
  calendlyBooked?: boolean;
  // Computed
  painScore?: number | null;
  estimatedValue?: number | null;
  // Generated
  roadmap?: any | null;
  status: "in_progress" | "completed" | "converted" | "abandoned";
  convertedAt?: string | null;
  projectId?: string | null;
  // Analytics
  timeToComplete?: number | null;
  dropoffPhase?: Phase | null;
}

export interface OpportunityTemplate {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  slug: string;
  category: "lead_gen" | "ops_automation" | "support" | "analytics" | "integration";
  difficulty: "low" | "medium" | "high";
  shortDescription: string;
  fullDescription: string;
  problemItSolves: string;
  avgDevCostMin: number;
  avgDevCostMax: number;
  avgTimeSavedHrsMonth: number;
  avgErrorReduction?: number | null;
  avgImplementationWeeks: number;
  complexity: "simple" | "moderate" | "complex";
  matchingRules: { keywords: string[]; systems?: string[]; painTypes?: string[] };
  techStack: string[];
  integrationsRequired: string[];
  exampleWorkflow?: string | null;
  realWorldExample?: string | null;
  timesMatched: number;
  avgClientSatisfaction?: number | null;
}

export interface AuditOpportunity {
  id: string;
  createdAt: string;
  sessionId: string; // link to AuditSession.sessionId for simplicity
  templateId: string;
  name: string;
  problemStatement: string;
  solutionDescription: string;
  category: OpportunityTemplate["category"];
  difficulty: OpportunityTemplate["difficulty"];
  hoursSavedPerMonth: number;
  monthlySavings: number;
  errorReduction?: number | null;
  devCostMin: number;
  devCostMax: number;
  devCostMid: number;
  implementationWeeks: number;
  breakevenMonths: number;
  roi12Months: number;
  roi36Months?: number | null;
  matchScore: number;
  rank: number;
  painPointsMatched: string[];
  systemsRequired: string[];
}

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  auditSessionId?: string | null;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  source: "audit" | "contact_form" | "calendly" | "referral";
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  painScore?: number | null;
  estimatedValue?: number | null;
  timeline?: string | null;
  status: "new" | "contacted" | "qualified" | "proposal_sent" | "converted" | "lost";
  calendlyBooked?: boolean;
  calendlyUrl?: string | null;
  firstContactDate?: string | null;
  lastContactDate?: string | null;
  convertedToProject?: boolean;
  projectId?: string | null;
  conversionDate?: string | null;
}

export interface Notification {
  id: string;
  createdAt: string;
  leadId: string;
  type: "discord" | "email" | "hubspot" | "slack";
  status: "pending" | "sent" | "failed";
  subject?: string | null;
  content: any;
  sentAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  retryCount?: number;
  discordMessageId?: string | null;
  emailMessageId?: string | null;
  hubspotDealId?: string | null;
}

export interface AuditAnalytics {
  id: string;
  date: string; // yyyy-mm-dd
  auditsStarted: number;
  auditsCompleted: number;
  auditsAbandoned: number;
  phase1Dropoff: number;
  phase2Dropoff: number;
  phase3Dropoff: number;
  avgTimeToComplete?: number | null;
  avgPainScore?: number | null;
  avgEstimatedValue?: number | null;
  leadsGenerated: number;
  callsBooked: number;
  proposalsSent: number;
  projectsWon: number;
  topOpportunities: { name: string; count: number }[];
}\n