import { AuditState } from "./audit-workflow";

export interface TechnicalScore {
  apiAvailable: boolean;
  dataAccessible: boolean;
  authFeasible: boolean;
  latencyAcceptable: boolean;
  licensingCompatible: boolean;
  score: number;
}

export interface OrganizationalScore {
  readiness: 'high' | 'medium' | 'low';
  policyCompliance: boolean;
  stakeholderBuyIn: boolean;
  timelineFeasible: boolean;
  resourceAvailable: boolean;
  score: number;
}

export interface FeasibilityResult {
  opportunityId: string;
  technical: TechnicalScore;
  org: OrganizationalScore;
  overallScore: number;
  overallStatus: 'green' | 'amber' | 'red';
  blockers: string[];
  recommendations: string[];
}

/**
 * Node 4: Feasibility Check
 * Evaluate technical and organizational feasibility for each opportunity
 */
export async function checkFeasibility(state: AuditState): Promise<Partial<AuditState>> {
  console.log(`[Feasibility] Checking opportunities for session: ${state.sessionId}`);

  const { opportunities, processes, extracted_data } = state;
  const rawOpportunities = opportunities.raw || [];

  try {
    const scores: FeasibilityResult[] = [];

    for (const opportunity of rawOpportunities) {
      const technical = await checkTechnicalFeasibility(opportunity, extracted_data, processes);
      const organizational = checkOrganizationalFeasibility(opportunity, extracted_data);
      const overall = calculateOverallScore(technical, organizational);
      const blockers = identifyBlockers(opportunity, technical, organizational);
      const recommendations = generateRecommendations(opportunity, technical, organizational);

      scores.push({
        opportunityId: opportunity.id,
        technical,
        org: organizational,
        overallScore: overall.score,
        overallStatus: overall.status,
        blockers,
        recommendations
      });
    }

    const highBlockers = scores.filter(s => s.overallStatus === 'red').map(s => s.opportunityId);

    console.log(`[Feasibility] Checked ${rawOpportunities.length} opportunities, ${highBlockers.length} have red flags`);

    return {
      feasibility: {
        scores,
        blockers: highBlockers
      }
    };
  } catch (error) {
    console.error("[Feasibility] Error:", error);
    return {
      feasibility: {
        scores: [],
        blockers: []
      }
    };
  }
}

// Technical feasibility scoring
async function checkTechnicalFeasibility(opportunity: any, extracted_data: any, processes: any): Promise<TechnicalScore> {
  let score = 0;
  const maxScore = 5;

  // Check system inventory from pain points answers
  const systems = extractSystemsFromData(extracted_data);
  const processesMap = processes.map || [];

  // API availability - check if mentioned systems have known APIs
  const apiAvailable = checkAPIAvailability(opportunity.category, systems);
  if (apiAvailable) score += 1;

  // Data accessibility - assess complexity of data extraction
  const dataAccessible = assessDataAccessibility(opportunity.category, processesMap);
  if (dataAccessible) score += 1;

  // Authentication feasibility - consider security requirements
  const authFeasible = assessAuthFeasibility(opportunity, systems);
  if (authFeasible) score += 1;

  // Latency acceptable - based on use case
  const latencyAcceptable = assessLatencyRequirements(opportunity.category);
  if (latencyAcceptable) score += 1;

  // Licensing compatibility - check for potential licensing conflicts
  const licensingCompatible = checkLicensing(opportunity, systems);
  if (licensingCompatible) score += 1;

  return {
    apiAvailable,
    dataAccessible,
    authFeasible,
    latencyAcceptable,
    licensingCompatible,
    score: Math.min(score, maxScore)
  };
}

// Organizational feasibility scoring
function checkOrganizationalFeasibility(opportunity: any, extracted_data: any): OrganizationalScore {
  const painPoints = extracted_data.pain_points || {};
  const budget = painPoints.budget || '';
  const timeline = painPoints.timeline || '';
  const userRole = painPoints.userRole || '';

  let score = 0;
  let readiness: 'high' | 'medium' | 'low' = 'medium';

  // Assess change readiness based on responses
  const changeWords = ['open', 'excited', 'ready', 'interested', 'explore'];
  const resistWords = ['traditional', 'resistance', 'skeptical', 'conservative', 'comfortable'];

  let readinessScore = 0;
  changeWords.forEach(word => {
    if (painPoints.manualTasks?.toLowerCase().includes(word) ||
        painPoints.bottlenecks?.toLowerCase().includes(word)) readinessScore += 1;
  });

  resistWords.forEach(word => {
    if (painPoints.manualTasks?.toLowerCase().includes(word) ||
        painPoints.bottlenecks?.toLowerCase().includes(word)) readinessScore -= 1;
  });

  readiness = readinessScore >= 2 ? 'high' : readinessScore <= -1 ? 'low' : 'medium';
  if (readiness === 'high') score += 2;
  else if (readiness === 'medium') score += 1;

  // Policy compliance - assume default true, adjust based on industry specifics
  const policyCompliance = checkPolicyCompliance(opportunity.category, extracted_data);
  if (policyCompliance) score += 1;

  // Stakeholder buy-in - based on user role and responses
  const stakeholderBuyIn = assessStakeholderBuyIn(userRole, budget);
  if (stakeholderBuyIn) score += 1;

  // Timeline feasible - check if timeline fits opportunity complexity
  const timelineFeasible = assessTimelineFeasibility(opportunity.effort, timeline);
  if (timelineFeasible) score += 1;

  // Resources available - rough assessment
  const resourceAvailable = score >= 3; // If other factors are good, likely have resources
  if (resourceAvailable) score += 1;

  return {
    readiness,
    policyCompliance,
    stakeholderBuyIn,
    timelineFeasible,
    resourceAvailable,
    score: Math.min(score, 5)
  };
}

// Calculate overall feasibility score
function calculateOverallScore(technical: TechnicalScore, organizational: OrganizationalScore) {
  const combinedScore = technical.score + organizational.score;
  let status: 'green' | 'amber' | 'red';

  if (combinedScore >= 8) status = 'green';
  else if (combinedScore >= 4) status = 'amber';
  else status = 'red';

  // Downgrade if technical blockers exist
  if (technical.score <= 2 && status === 'green') status = 'amber';
  if (technical.score <= 1) status = 'red';

  return { score: combinedScore, status };
}

// Identify specific blockers
function identifyBlockers(opportunity: any, technical: TechnicalScore, organizational: OrganizationalScore): string[] {
  const blockers: string[] = [];

  if (!technical.apiAvailable)
    blockers.push("Systems lack API integration capabilities");

  if (!technical.dataAccessible)
    blockers.push("Data extraction complexity may hinder implementation");

  if (!technical.licensingCompatible)
    blockers.push("Potential licensing conflicts with existing software");

  if (organizational.readiness === 'low')
    blockers.push("Organizational resistance to change may impede adoption");

  if (!organizational.stakeholderBuyIn)
    blockers.push("Lack of stakeholder buy-in could block execution");

  if (!organizational.timelineFeasible)
    blockers.push("Timeline expectations don't align with implementation complexity");

  return blockers;
}

// Generate recommendations to improve feasibility
function generateRecommendations(opportunity: any, technical: TechnicalScore, organizational: OrganizationalScore): string[] {
  const recommendations: string[] = [];

  if (!technical.apiAvailable) {
    recommendations.push("Start with smaller pilot using systems that have existing APIs");
    recommendations.push("Consider middleware solutions for API-less systems");
  }

  if (!technical.dataAccessible) {
    recommendations.push("Prioritize data accessibility assessment in planning phase");
    recommendations.push("Consider manual data bridges for initial proof-of-concept");
  }

  if (organizational.readiness === 'low') {
    recommendations.push("Begin with stakeholder education and change management");
    recommendations.push("Start with low-risk pilot projects to build confidence");
  }

  if (!organizational.stakeholderBuyIn) {
    recommendations.push("Conduct executive demos and ROI presentations early");
    recommendations.push("Involve decision-makers in pilot scoping");
  }

  if (technical.score > organizational.score) {
    recommendations.push("Focus on organizational change management alongside technical implementation");
  }

  return recommendations;
}

/// Helper functions for feasibility assessment

function extractSystemsFromData(extracted_data: any): string[] {
  const systems: string[] = [];

  // From discovery flows
  if (extracted_data.discovery) {
    const discovery = extracted_data.discovery;
    if (discovery.acquisitionFlow) systems.push(...parseSystems(discovery.acquisitionFlow));
    if (discovery.deliveryFlow) systems.push(...parseSystems(discovery.deliveryFlow));
  }

  // From pain points
  if (extracted_data.pain_points) {
    const painPoints = extracted_data.pain_points;
    if (painPoints.manualTasks) systems.push(...parseSystems(painPoints.manualTasks));
    if (painPoints.dataSilos) systems.push(...parseSystems(painPoints.dataSilos));
  }

  return [...new Set(systems)]; // Remove duplicates
}

function parseSystems(text: string): string[] {
  const systemPatterns = [
    /salesforce/gi, /hubspot/gi, /slack/gi, /gmail/gi, /google/gi,
    /microsoft/gi, /outlook/gi, /excel/gi, /sheets/gi, /drive/gi,
    /dropbox/gi, /box/gi, /one drive/gi, /sharepoint/gi,
    /zendesk/gi, /intercom/gi, /freshdesk/gi, /jira/gi, /confluence/gi,
    /sap/gi, /oracle/gi, /netsuite/gi, /quickbooks/gi, /xero/gi
  ];

  return systemPatterns
    .map(pattern => {
      const match = text.match(pattern);
      return match ? standardizeSystemName(match[0]) : null;
    })
    .filter(Boolean) as string[];
}

function standardizeSystemName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('salesforce')) return 'salesforce';
  if (lower.includes('hubspot')) return 'hubspot';
  if (lower.includes('slack')) return 'slack';
  if (lower.includes('gmail') || lower.includes('google')) return 'gmail';
  if (lower.includes('microsoft') || lower.includes('outlook')) return 'microsoft';
  if (lower.includes('dropbox')) return 'dropbox';
  if (lower.includes('zendesk')) return 'zendesk';
  if (lower.includes('sap')) return 'sap';
  if (lower.includes('oracle')) return 'oracle';
  return name.toLowerCase();
}

function checkAPIAvailability(category: string, systems: string[]): boolean {
  const apiCompatibleSystems = ['salesforce', 'hubspot', 'slack', 'gmail', 'dropbox', 'zendesk'];
  const systemHasAPIs = systems.some(s => apiCompatibleSystems.includes(s.toLowerCase()));

  return systemHasAPIs || category === 'automation' || category === 'integration';
}

function assessDataAccessibility(category: string, processesMap: any[]): boolean {
  if (category === 'rag' || category === 'agent') return true; // These work with accessible data
  if (category === 'automation') return true; // Process automation can work with available data

  // Integration/toolSwap depend on API access which we already checked
  return true; // Assume accessible unless we find contradictory evidence
}

function assessAuthFeasibility(opportunity: any, systems: string[]): boolean {
  // Basic auth is feasible unless dealing with highly secure systems
  const highSecuritySystems = ['sap', 'oracle'];
  const hasHighSecurity = systems.some(s => highSecuritySystems.includes(s.toLowerCase()));

  if (hasHighSecurity && opportunity.category === 'integration') {
    return false; // Complex enterprise auth
  }

  return true; // Most modern systems support API auth
}

function assessLatencyRequirements(category: string): boolean {
  // Real-time requirements for certain categories
  if (category === 'agent' || category === 'automation') {
    return true; // These require lower latency
  }

  return true; // Other categories can handle moderate latency
}

function checkLicensing(opportunity: any, systems: string[]): boolean {
  // Basic assumption - most licensing is compatible
  // In production, would check specific combinations

  return true; // Assume compatible unless we know differently
}

function checkPolicyCompliance(category: string, extracted_data: any): boolean {
  // Assume compliant unless dealing with regulated data
  const discovery = extracted_data.discovery;
  const complianceRiskIndustries = ['healthcare', 'finance', 'insurance'];

  if (discovery?.industry && complianceRiskIndustries.some(ind =>
    discovery.industry.toLowerCase().includes(ind))) {

    // Higher compliance requirements for certain categories
    if (category === 'integration') {
      return false; // May require compliance reviews
    }
  }

  return true; // Default assumption
}

function assessStakeholderBuyIn(userRole: string, budget: string): boolean {
  // Assess buy-in based on user role and budget language
  const decisionRoles = ['ceo', 'president', 'vp', 'director', 'head', 'chief'];
  const hasDecisionPower = decisionRoles.some(role =>
    userRole.toLowerCase().includes(role));

  const commitmentWords = ['committed', 'already', 'budget', 'investment'];
  const showsCommitment = commitmentWords.some(word =>
    budget.toLowerCase().includes(word));

  return hasDecisionPower || showsCommitment;
}

function assessTimelineFeasibility(effort: number, timeline: string): boolean {
  const months = parseTimeline(timeline);
  const requiredWeeks = effort * 2; // Rough weeks estimate per effort level
  const requiredMonths = requiredWeeks / 4;

  return months >= requiredMonths;
}

function parseTimeline(timeline: string): number {
  const monthMatch = timeline.match(/(\d+)\s*(?:month|mo)/i);
  if (monthMatch) return parseInt(monthMatch[1]);

  const weekMatch = timeline.match(/(\d+)\s*(?:week|wk)/i);
  if (weekMatch) return parseInt(weekMatch[1]) / 4;

  // Default conservative assumption
  if (timeline.toLowerCase().includes('quarter')) return 3;
  if (timeline.toLowerCase().includes('month')) return 1;
  if (timeline.toLowerCase().includes('week')) return 0.25;

  return 3; // Default 3 months
}
