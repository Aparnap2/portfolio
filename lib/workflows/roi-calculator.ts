import { AuditState } from "./audit-workflow";

export interface ROIScenario {
  savings: number;
  breakeven: number;
  monthlySavings: number;
  implementationCost: number;
  annualROI: number;
  confidence: 'conservative' | 'base' | 'aggressive';
}

export interface RoadmapItem {
  name: string;
  monthlySavings: number;
  implementationWeeks: number;
  roi: number;
  category: string;
  startWeek: number;
  endWeek: number;
}

/**
 * Node 5: ROI Calculator
 * Calculate conservative/base/aggressive ROI scenarios and build prioritized roadmap
 */
export async function calculateROI(state: AuditState): Promise<Partial<AuditState>> {
  console.log(`[ROI] Calculating scenarios for session: ${state.sessionId}`);

  const { opportunities, processes, feasibility } = state;
  const rawOpportunities = opportunities.raw || [];
  const baselines = processes.baselines || { volumes: 0, cycleTime: 0, errors: 0 };
  const feasibilityScores = feasibility.scores || [];

  try {
    // Generate three ROI scenarios
    const conservative = calculateROIScenario(rawOpportunities, baselines, 0.7, feasibilityScores, 'conservative');
    const base = calculateROIScenario(rawOpportunities, baselines, 1.0, feasibilityScores, 'base');
    const aggressive = calculateROIScenario(rawOpportunities, baselines, 1.3, feasibilityScores, 'aggressive');

    const scenarios = { conservative, base, aggressive };

    // Build prioritized roadmap
    const prioritizedOpportunities = prioritizeForRoadmap(rawOpportunities);
    const roadmap = build90DayRoadmap(prioritizedOpportunities);

    console.log(`[ROI] Calculated scenarios: Conservative ROI=${conservative.annualROI.toFixed(0)}%, Base=${base.annualROI.toFixed(0)}%, Aggressive=${aggressive.annualROI.toFixed(0)}%`);

    return {
      roi: {
        scenarios,
        roadmap
      }
    };
  } catch (error) {
    console.error("[ROI] Error:", error);
    return {
      roi: {
        scenarios: {
          conservative: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: 'conservative' as const },
          base: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: 'base' as const },
          aggressive: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: 'aggressive' as const }
        },
        roadmap: { quickWins: [], bigSwings: [], phases: [] }
      }
    };
  }
}

// Calculate ROI for a specific scenario with modification factor
function calculateROIScenario(opportunities: any[], baselines: any, factor: number, feasibilityScores: any[], confidence: 'conservative' | 'base' | 'aggressive'): ROIScenario {
  let totalMonthlySavings = 0;
  let totalImplementationCost = 0;

  // Calculate savings weighted by feasibility
  opportunities.forEach(opp => {
    // Apply feasibility adjustment - lower feasibility reduces expected savings
    const feasibilityScore = getFeasibilityAdjustment(opp.id, feasibilityScores);
    const adjustedSavings = opp.impact * factor * feasibilityScore;
    totalMonthlySavings += Math.max(0, adjustedSavings); // Ensure non-negative

    // Calculate implementation cost based on effort level
    const baseCost = getImplementationCost(opp.effort);
    totalImplementationCost += baseCost;
  });

  const annualSavings = totalMonthlySavings * 12;
  const annualROI = totalImplementationCost > 0 ? ((annualSavings - totalImplementationCost) / totalImplementationCost) * 100 : 0;
  const breakevenMonths = totalImplementationCost > 0 ? Math.ceil((totalImplementationCost / totalMonthlySavings)) : 0;

  return {
    savings: Math.round(annualSavings),
    breakeven: breakevenMonths,
    monthlySavings: Math.round(totalMonthlySavings),
    implementationCost: Math.round(totalImplementationCost),
    annualROI: Math.round(annualROI),
    confidence
  };
}

// Get feasibility adjustment factor (0.3-1.0)
function getFeasibilityAdjustment(opportunityId: string, feasibilityScores: any[]): number {
  const feasibility = feasibilityScores.find(score => score.opportunityId === opportunityId);
  if (!feasibility) return 0.8; // Default moderate feasibility

  // Convert green/amber/red to numerical multiplier
  const statusMultipliers = { green: 1.0, amber: 0.7, red: 0.3 };
  const statusMultiplier = statusMultipliers[feasibility.overallStatus] || 0.7;

  // Apply technical/organizational score bonus
  const technicalBonus = feasibility.technical.score * 0.1;
  const orgBonus = feasibility.org.score * 0.1;

  return Math.min(1.0, statusMultiplier + technicalBonus + orgBonus);
}

// Get implementation cost based on effort level (1-5)
function getImplementationCost(effort: number): number {
  // Rough cost estimates - in production would use more sophisticated pricing
  const baseCosts = {
    1: 5000,   // Low effort - quick implementation
    2: 15000,  // Basic automation/tool
    3: 30000,  // Medium complexity
    4: 60000,  // Complex integration
    5: 100000  // Enterprise agent implementation
  };

  return baseCosts[effort as keyof typeof baseCosts] || 25000;
}

// Prioritize opportunities for roadmap construction
function prioritizeForRoadmap(opportunities: any[]): any[] {
  return opportunities
    .map(opp => ({
      ...opp,
      priority: calculatePriorityScore(opp) // Internal priority scoring
    }))
    .sort((a, b) => b.priority - a.priority);
}

// Calculate internal priority score for roadmap sequencing
function calculatePriorityScore(opportunity: any): number {
  let priority = opportunity.impact;

  // Boost for quick wins (effort 1-2, good ROI)
  if (opportunity.effort <= 2 && opportunity.roi > 100) priority *= 1.5;

  // Boost for high ROI
  if (opportunity.roi > 200) priority *= 1.2;

  // Penalize high effort
  if (opportunity.effort >= 5) priority *= 0.8;

  return priority;
}

// Build 90-day implementation roadmap
function build90DayRoadmap(prioritizedOpportunities: any[]): { quickWins: any[]; bigSwings: any[]; phases: any[] } {
  const phases: RoadmapItem[] = [];
  const quickWins: any[] = [];
  const bigSwings: any[] = [];

  let currentWeek = 0;
  const maxWeeks = 12; // 3 month timeframe

  // Separate quick wins and big swings
  const lowEffort = prioritizedOpportunities.filter(o => o.effort <= 2);
  const highImpact = prioritizedOpportunities.filter(o => o.effort >= 4);

  quickWins.push(...lowEffort.slice(0, 3)); // Top 3 quick wins
  bigSwings.push(...highImpact.slice(0, 3)); // Top 3 big swings

  // Build sequential implementation phases
  prioritizedOpportunities.forEach((opp, index) => {
    if (currentWeek >= maxWeeks) return; // Don't exceed 90 days

    const startWeek = currentWeek;
    const endWeek = startWeek + opp.implementationWeeks;

    // Skip if this opportunity would exceed timeframe
    if (endWeek > maxWeeks) return;

    phases.push({
      name: opp.name,
      monthlySavings: opp.impact,
      implementationWeeks: opp.implementationWeeks,
      roi: opp.roi,
      category: opp.category,
      startWeek,
      endWeek
    });

    currentWeek = endWeek;
  });

  return { quickWins, bigSwings, phases };
}

// Helper functions for ROI analysis

export function predictCashFlowImpact(roadmap: any[]): { monthly: number[]; cumulative: number[] } {
  const monthly = new Array(12).fill(0);
  const cumulative = new Array(12).fill(0);

  roadmap.forEach(phase => {
    const startMonth = Math.floor(phase.startWeek / 4);
    const endMonth = Math.floor(phase.endWeek / 4);

    // Apply savings starting from completion month
    for (let month = endMonth; month < 12; month++) {
      monthly[month] += phase.monthlySavings;
    }
  });

  // Calculate cumulative
  let runningTotal = 0;
  for (let i = 0; i < 12; i++) {
    runningTotal += monthly[i];
    cumulative[i] = runningTotal;
  }

  return { monthly, cumulative };
}

export function calculateConfidenceIntervals(scenario: ROIScenario): { low: number; high: number; expected: number } {
  // Simple confidence interval calculation
  const variance = 0.2; // 20% variance assumption
  const low = scenario.annualROI * (1 - variance);
  const high = scenario.annualROI * (1 + variance);

  return {
    low: Math.max(0, Math.round(low)),
    high: Math.round(high),
    expected: scenario.annualROI
  };
}

export function optimizeOpportunitySequence(opportunities: any[]): any[] {
  // Optimize sequence to maximize early ROI and minimize risk
  return opportunities.sort((a, b) => {
    // Prioritize by: ROI/effort ratio, then by effort level (lower first)
    const roiEffortA = a.roi / a.effort;
    const roiEffortB = b.roi / b.effort;

    if (Math.abs(roiEffortA - roiEffortB) > 10) {
      return roiEffortB - roiEffortA; // Higher ROI/effort first
    }

    return a.effort - b.effort; // Lower effort first
  });
}

export function generateExecutiveSummary(scenarios: any, roadmap: any): string {
  const baseROI = scenarios.base.annualROI;
  const quickWins = roadmap.quickWins;
  const bigSwings = roadmap.bigSwings;

  let summary = `AI Opportunity Assessment Results:\n\n`;
  summary += `Projected ROI: ${baseROI}% annually\n`;
  summary += `Monthly Savings: $${scenarios.base.monthlySavings.toLocaleString()}\n`;
  summary += `Implementation Timeline: 90 days\n\n`;

  if (quickWins.length > 0) {
    summary += `Quick Wins (${quickWins.length}):\n`;
    quickWins.forEach(win => {
      summary += `• ${win.name}: $${win.impact}/month, ${win.implementationWeeks} weeks\n`;
    });
  }

  if (bigSwings.length > 0) {
    summary += `\nBig Swings (${bigSwings.length}):\n`;
    bigSwings.forEach(swing => {
      summary += `• ${swing.name}: ${swing.roi}% ROI, ${swing.implementationWeeks} weeks\n`;
    });
  }

  summary += `\nNext Steps: Schedule meeting to discuss implementation priorities.`;

  return summary;
}
