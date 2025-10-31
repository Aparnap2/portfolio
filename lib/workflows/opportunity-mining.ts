import { AuditState } from "./audit-workflow";

export interface CategorizedOpportunity {
  id: string;
  name: string;
  category: "automation" | "agent" | "rag" | "integration" | "toolSwap";
  problemStatement: string;
  solution: string;
  effort: number; // 1-5 scale
  impact: number; // estimated monthly savings
  dependencies: string[];
  roi: number; // ROI percentage
}

/**
 * Node 3: Opportunity Mining & Categorization
 * Classify opportunities and generate detailed opportunity cards
 */
export async function categorizeOpportunities(state: AuditState): Promise<Partial<AuditState>> {
  console.log(`[Opportunity Mining] Categorizing opportunities for session: ${state.sessionId}`);

  const { processes, extracted_data } = state;
  const bottlenecks = processes.bottlenecks || [];

  try {
    const rawOpportunities = generateOpportunitiesFromBottlenecks(bottlenecks, extracted_data);
    const categorizedOpportunities = categorizeOpportunitiesByType(rawOpportunities);

    console.log(`[Opportunity Mining] Generated ${rawOpportunities.length} opportunities`);
    console.log(`[Opportunity Mining] Categorized as: ${JSON.stringify(Object.keys(categorizedOpportunities).reduce((acc, key) => ({...acc, [key]: categorizedOpportunities[key as keyof typeof categorizedOpportunities].length}), {}))}`);

    return {
      opportunities: {
        raw: rawOpportunities,
        categorized: categorizedOpportunities
      }
    };
  } catch (error) {
    console.error("[Opportunity Mining] Error:", error);
    return {
      opportunities: {
        raw: [],
        categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] }
      }
    };
  }
}

// Generate opportunities from identified bottlenecks
function generateOpportunitiesFromBottlenecks(bottlenecks: any[], extracted_data: any): CategorizedOpportunity[] {
  const opportunities: CategorizedOpportunity[] = [];
  const painPoints = extracted_data.pain_points;

  bottlenecks.forEach(bottleneck => {
    switch (bottleneck.type) {
      case "approval":
        opportunities.push({
          id: `auto-${bottleneck.id}`,
          name: "Automated Approval Workflows",
          category: "automation",
          problemStatement: `${bottlenecks.length} manual approval processes are causing delays and decision bottlenecks`,
          solution: "Implement AI-powered approval routing with smart escalation rules and parallel processing",
          effort: 3,
          impact: bottleneck.baseline.timeCost,
          dependencies: ["Workflow Engine", "Email Integration"],
          roi: calculateROI(bottleneck.baseline, 3, 0.7)
        });
        break;

      case "data-entry":
        opportunities.push({
          id: `integration-${bottleneck.id}`,
          name: "Data Integration Platform",
          category: "integration",
          problemStatement: `Manual data entry and system syncs are consuming ${bottleneck.baseline.timeCost} hours monthly`,
          solution: "Build automated data pipelines between all identified systems with real-time sync",
          effort: 4,
          impact: bottleneck.baseline.timeCost,
          dependencies: ["ETL Tools", "API Connections", "Data Mapping"],
          roi: calculateROI(bottleneck.baseline, 4, 0.8)
        });

        if (bottleneck.impact > 6) {
          opportunities.push({
            id: `rag-${bottleneck.id}`,
            name: "AI Knowledge Assistant",
            category: "rag",
            problemStatement: "Repetitive questions and data lookups require constant manual research",
            solution: "Create RAG-powered chatbot that can answer questions using company knowledge base",
            effort: 2,
            impact: bottleneck.baseline.timeCost * 0.6,
            dependencies: ["Document Indexing", "Vector Search"],
            roi: calculateROIFromSavings(bottleneck.baseline.timeCost * 0.6, 2)
          });
        }
        break;

      case "handoff":
        opportunities.push({
          id: `agent-${bottleneck.id}`,
          name: "Multi-Agent Task Coordination",
          category: "agent",
          problemStatement: `${bottleneck.baseline.volume} handoffs monthly create inefficiencies and information loss`,
          solution: "Deploy AI agents to coordinate tasks across teams with automated status tracking",
          effort: 5,
          impact: bottleneck.baseline.timeCost,
          dependencies: ["Agent Framework", "Team APIs", "SLAs"],
          roi: calculateROI(bottleneck.baseline, 5, 0.9)
        });
        break;

      case "manual":
        opportunities.push({
          id: `tool-${bottleneck.id}`,
          name: "Tool Consolidation & Automation",
          category: "toolSwap",
          problemStatement: "Scattered manual processes across multiple disconnected tools",
          solution: "Centralize workflows in integrated platform with automated triggers and notifications",
          effort: 3,
          impact: bottleneck.baseline.timeCost * 0.5,
          dependencies: ["Tool Migration", "Training", "Process Redesign"],
          roi: calculateROIFromSavings(bottleneck.baseline.timeCost * 0.5, 3)
        });
        break;
    }
  });

  return opportunities;
}

// Classify opportunities into 5 specific categories
function categorizeOpportunitiesByType(opportunities: CategorizedOpportunity[]): AuditState['opportunities']['categorized'] {
  const categorized = {
    automation: opportunities.filter(opp => opp.category === "automation"),
    agent: opportunities.filter(opp => opp.category === "agent"),
    rag: opportunities.filter(opp => opp.category === "rag"),
    integration: opportunities.filter(opp => opp.category === "integration"),
    toolSwap: opportunities.filter(opp => opp.category === "toolSwap")
  };

  return categorized;
}

// Calculate ROI percentage from baseline metrics
function calculateROI(baseline: any, effort: number, improvementFactor: number): number {
  const monthlySavings = (baseline.timeCost * 0.7); // Conservative 70% time savings
  const implementationCost = effort * 2000; // Rough cost estimation
  const annualSavings = monthlySavings * 12;
  const roi = ((annualSavings - implementationCost) / implementationCost) * 100;

  return Math.max(0, Math.round(roi));
}

function calculateROIFromSavings(monthlySavings: number, effort: number): number {
  const implementationCost = effort * 2000;
  const annualSavings = monthlySavings * 12;
  const roi = ((annualSavings - implementationCost) / implementationCost) * 100;

  return Math.max(0, Math.round(roi));
}

// Add AI-assisted categorization using LLM for better accuracy
export async function enhanceOpportunityDescriptions(opportunities: CategorizedOpportunity[], extracted_data: any): Promise<CategorizedOpportunity[]> {
  // This would use LLM to enhance problem statements and solutions with company-specific details
  return opportunities.map(opp => ({
    ...opp,
    problemStatement: personalizeProblem(opp.problemStatement, extracted_data),
    solution: personalizeSolution(opp.solution, extracted_data)
  }));
}

// Personalize opportunity descriptions with company context
function personalizeProblem(problem: string, extracted_data: any): string {
  const company = extracted_data.contact_info?.company || "the company";
  const industry = extracted_data.discovery?.industry || "your industry";

  return problem
    .replace(/bottleneck/gi, `bottleneck affecting ${company}`)
    .replace(/manual/gi, `manual process in ${industry}`)
    .replace(/data/gi, `${company}'s data`);
}

function personalizeSolution(solution: string, extracted_data: any): string {
  const company = extracted_data.contact_info?.company || "your company";
  const industry = extracted_data.discovery?.industry || "your industry";

  return solution
    .replace(/implement/gi, `implement for ${company}`)
    .replace(/create/gi, `create tailored for ${industry}`)
    .replace(/build/gi, `build specifically for ${company}'s needs`);
}

// Apply priority scoring for opportunity ranking
export function prioritizeOpportunities(opportunities: CategorizedOpportunity[]): CategorizedOpportunity[] {
  return opportunities
    .map(opp => ({
      ...opp,
      priority: calculatePriority(opp)
    }))
    .sort((a, b) => b.priority - a.priority);

  function calculatePriority(opp: CategorizedOpportunity): number {
    let priority = opp.impact;

    // Boost for quick wins (effort 1-2, high ROI)
    if (opp.effort <= 2 && opp.roi > 100) priority *= 1.5;

    // Boost for high ROI opportunities
    if (opp.roi > 200) priority *= 1.2;

    // Penalize high effort items
    if (opp.effort >= 5) priority *= 0.8;

    return priority;
  }
}

// Generate quick win recommendations (top 3 low-effort opportunities)
export function getQuickWins(opportunities: CategorizedOpportunity[]): CategorizedOpportunity[] {
  return opportunities
    .filter(opp => opp.effort <= 2)
    .filter(opp => opp.roi > 50)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 3);
}

// Generate big swing recommendations (top high-impact opportunities)
export function getBigSwings(opportunities: CategorizedOpportunity[]): CategorizedOpportunity[] {
  return opportunities
    .filter(opp => opp.effort >= 4)
    .filter(opp => opp.roi > 150)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);
}
