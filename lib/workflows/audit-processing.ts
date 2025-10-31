import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AuditState, embeddings } from "./audit-workflow";

// This file contains the backend processing logic from the original PRD-based workflow.
// It has been separated to keep the conversational and processing logic distinct.

const llm = process.env.GOOGLE_API_KEY
  ? new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro",
      temperature: 0.3,
      apiKey: process.env.GOOGLE_API_KEY,
    })
  : {
      invoke: async () => {
        throw new Error("GOOGLE_API_KEY is not set.");
      },
    };

/**
 * Node 4: Match Opportunities
 * AI-powered matching of pain points to opportunity templates
 */
export async function matchOpportunities(state: AuditState): Promise<Partial<AuditState>> {
  console.log(`[Matching] Processing session: ${state.sessionId}`);
  
  try {
    const { extracted_data } = state;
    // Load opportunity templates
    const templates = await db.opportunityTemplate.findMany({
      where: {
        category: {
          in: determineCategoriesFromPainPoints(extracted_data.pain_points)
        }
      }
    });
    
    console.log(`[Matching] Found ${templates.length} potential templates`);
    
    // Use LLM to match and rank opportunities
    const matchingPrompt = `
You are an AI automation consultant. Analyze the client's pain points and match them to the best automation opportunities.

CLIENT CONTEXT:
- Industry: ${extracted_data.discovery?.industry}
- Company size: ${extracted_data.discovery?.companySize}
- Manual tasks: ${extracted_data.pain_points?.manualTasks}
- Bottlenecks: ${extracted_data.pain_points?.bottlenecks}
- Data silos: ${extracted_data.pain_points?.dataSilos}

AVAILABLE OPPORTUNITIES:
${templates.map((t, i) => `
${i + 1}. ${t.name} (${t.category}, ${t.difficulty})
   Problem it solves: ${t.problemItSolves}
   Average time saved: ${t.avgTimeSavedHrsMonth} hrs/month
   Implementation: ${t.avgImplementationWeeks} weeks
`).join("\n")} 

TASK:
1. Match the top 3 opportunities that best address the client's pain points
2. For each match, provide:
   - Match score (0-100) based on relevance
   - Specific pain points it addresses
   - Customized problem statement for THIS client
   - Estimated impact for THIS client (consider their hours/week)

Return JSON array of top 3 matches in this format:
[
  {
    "templateId": "template_id_here",
    "matchScore": 85,
    "painPointsAddressed": ["data_entry", "reporting"],
    "customProblemStatement": "Your sales team spends 15 hrs/week manually...",
    "customSolution": "Automate lead qualification with AI chatbot that...",
    "estimatedHoursSaved": 12,
    "reasoning": "This addresses their biggest pain point..."
  },
  ...
]
`;

    const response = await llm.invoke(matchingPrompt);
    const matchedOpps = JSON.parse(response.content as string);
    
    console.log(`[Matching] LLM matched ${matchedOpps.length} opportunities`);
    
    const opportunities = await Promise.all(
      (matchedOpps as any[]).slice(0, 3).map(async (match: any, index: number) => {
        const template = templates.find(t => t.id === match.templateId);
        if (!template) return null;
        
        // This part needs to be adapted as we don't have hoursPerWeek directly
        const hoursSaved = match.estimatedHoursSaved || template.avgTimeSavedHrsMonth;
        const avgHourlyRate = 60; // Default value
        const monthlySavings = hoursSaved * avgHourlyRate;
        const devCostMid = (template.avgDevCostMin + template.avgDevCostMax) / 2;
        const breakevenMonths = devCostMid / monthlySavings;
        const roi12Months = Math.round(((monthlySavings * 12 - devCostMid) / devCostMid) * 100);
        
        const opportunity = {
            templateId: template.id,
            name: template.name,
            problemStatement: match.customProblemStatement,
            solutionDescription: match.customSolution,
            category: template.category,
            difficulty: template.difficulty,
            hoursSavedPerMonth: hoursSaved,
            monthlySavings,
            devCostMid: Math.round(devCostMid),
            implementationWeeks: template.avgImplementationWeeks,
            breakevenMonths: parseFloat(breakevenMonths.toFixed(1)),
            roi12Months,
            matchScore: match.matchScore,
            rank: index + 1,
        };
        return opportunity;
      })
    );
    
    const validOpportunities = opportunities.filter(Boolean);
    console.log(`[Matching] Created ${validOpportunities.length} opportunity records`);

    return {
      opportunities: {
        raw: validOpportunities,
        categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] }
      }
    };
    
  } catch (error) {
    console.error("[Matching] Error:", error);
    // Handle error state appropriately
    return { ...state };
  }
}

/**
 * Node 5: Generate Report & Roadmap
 */
export async function generateReport(state: AuditState): Promise<Partial<AuditState>> {
  console.log(`[Report] Generating for session: ${state.sessionId}`);
  if (!state.opportunities || state.opportunities.raw.length === 0) {
    throw new Error("No opportunities found to generate report");
  }

  const roadmap = generateRoadmap(state.opportunities.raw);
  console.log(`[Report] Generated roadmap with ${roadmap.phases.length} phases`);

  // Generate Google Docs report using existing integration
  const googleDocReport = await generateComprehensiveReport(state);

  return {
    ...state,
    roadmap,
    report: {
      googleDocUrl: googleDocReport.docUrl,
      summary: generateExecutiveSummary(state.roi.scenarios, state.roadmap),
      content: generateReportContent(state)
    }
  };
}

/**
 * Generate comprehensive report using Google Docs
 */
async function generateComprehensiveReport(state: AuditState) {
  const { createGoogleDoc } = await import("@/lib/integrations/google-docs");
  return await createGoogleDoc(state);
}

/**
 * Generate executive summary
 */
function generateExecutiveSummary(scenarios: any, roadmap: any): string {
  const baseScenario = scenarios?.base || { savings: 0, monthlySavings: 0, annualROI: 0 };
  const quickWins = roadmap?.quickWins || [];
  const bigSwings = roadmap?.bigSwings || [];

  return `
🎯 Executive Summary: AI Opportunity Assessment

📊 Financial Impact:
• Annual Savings: $${(baseScenario.savings || 0).toLocaleString()}
• Monthly Savings: $${(baseScenario.monthlySavings || 0).toLocaleString()}
• ROI: ${baseScenario.annualROI || 0}% (12 months)

🚀 Quick Wins (${quickWins.length}):
${quickWins.slice(0, 3).map((win: any) => `• ${win.name}: $${(win.impact || 0).toLocaleString()}/month`).join('\n')}

💪 Big Swings (${bigSwings.length}):
${bigSwings.slice(0, 3).map((swing: any) => `• ${swing.name}: ${(swing.roi || 0)}% ROI`).join('\n')}

⏱️ Implementation Timeline: 90 days
  `;
}

/**
 * Generate detailed report content
 */
function generateReportContent(state: AuditState): string {
  const { extracted_data, opportunities, processes, feasibility, roi } = state;

  return `
COMPANY OVERVIEW
Company: ${extracted_data?.contact_info?.company || 'Client Company'}
Industry: ${extracted_data?.discovery?.industry || 'Not specified'}
Team Size: ${extracted_data?.discovery?.companySize || 'Not specified'}

PAIN POINTS IDENTIFIED
${extracted_data?.pain_points?.manualTasks ? `• Manual Tasks: ${extracted_data.pain_points.manualTasks}` : ''}
${extracted_data?.pain_points?.bottlenecks ? `• Process Bottlenecks: ${extracted_data.pain_points.bottlenecks}` : ''}
${extracted_data?.pain_points?.dataSilos ? `• Data Silos: ${extracted_data.pain_points.dataSilos}` : ''}

PROCESS MAPPING RESULTS
${processes?.bottlenecks?.map((bottleneck: any) => `• ${bottleneck.type.toUpperCase()}: ${bottleneck.description}`).join('\n') || 'No bottlenecks identified'}

OPPORTUNITIES IDENTIFIED (${opportunities?.raw?.length || 0})
${opportunities?.categorized &&
  Object.entries(opportunities.categorized).map(([category, opps]) =>
    `${category.toUpperCase()} (${(opps as any[]).length}):\n${(opps as any[]).map(opp => `  • ${opp.name} (${opp.category})`).join('\n')}`
  ).join('\n\n') || 'No opportunities categorized'}

FEASIBILITY ANALYSIS
${feasibility?.scores?.slice(0, 3).map((score: any) =>
  `• ${score.opportunityId}: ${score.overallStatus.toUpperCase()} (Technical: ${score.technical.score}/5, Org: ${score.org.score}/5)`
).join('\n') || 'No feasibility analysis available'}

FINANCIAL PROJECTIONS
Conservative Scenario: ${roi?.scenarios?.conservative?.annualROI || 0}% ROI
Base Scenario: ${roi?.scenarios?.base?.annualROI || 0}% ROI
Aggressive Scenario: ${roi?.scenarios?.aggressive?.annualROI || 0}% ROI

Monthly Savings: $${roi?.scenarios?.base?.monthlySavings || 0}
Annual Savings: $${roi?.scenarios?.base?.savings || 0}
90-Day Timeline Phases: ${roi?.roadmap?.phases?.length || 0} total
  `;
}

/**
 * Node 6: Send Notifications
 */
export async function sendNotifications(state: AuditState): Promise<Partial<AuditState>> {
    console.log(`[Notifications] Sending for session: ${state.sessionId}`);
    
    const { extracted_data, opportunities, roadmap, painScore } = state;
    const contact_info = extracted_data.contact_info;

    if (!contact_info?.email || !contact_info?.name) {
        console.error("[Notifications] Missing contact information");
        return { ...state, current_step: "finished" };
    }

    try {
        // Import integrations
        const { sendAuditReportEmail } = await import("@/lib/integrations/hubspot-email");
        const { sendDiscordAlert } = await import("@/lib/integrations/discord");

        // 1. Send HubSpot email with report
        const emailResult = await sendAuditReportEmail({
            sessionId: state.sessionId!,
            name: contact_info.name,
            email: contact_info.email,
            company: contact_info.company,
            painScore: painScore || 0,
            estimatedValue: calculateEstimatedValue(opportunities.raw),
            opportunities: opportunities.raw.map(opp => ({
                name: opp.name,
                monthlySavings: opp.monthlySavings,
                implementationWeeks: opp.implementationWeeks,
                roi12Months: opp.roi12Months,
            })),
            roadmap: roadmap || { totalDuration: "TBD", phases: [] },
            slackChannelUrl: process.env.SLACK_CHANNEL_URL,
        });

        console.log(`[Notifications] Email result:`, emailResult.success ? "✅ Sent" : "❌ Failed");

        // 2. Send Discord alert for internal team
        const discordResult = await sendDiscordAlert({
            sessionId: state.sessionId!,
            name: contact_info.name,
            email: contact_info.email,
            company: contact_info.company,
            painScore: painScore,
            estimatedValue: calculateEstimatedValue(opportunities.raw),
            timeline: extracted_data.pain_points?.timeline,
            topOpportunity: opportunities.raw[0]?.name,
            budgetRange: extracted_data.pain_points?.budget,
            userRole: extracted_data.pain_points?.userRole,
        });

        console.log(`[Notifications] Discord result:`, discordResult.success ? "✅ Sent" : "❌ Failed");

        // 3. Save final audit session data
        if (state.sessionId) {
            await db.auditSession.upsert({
                where: { sessionId: state.sessionId },
                create: {
                    sessionId: state.sessionId,
                    industry: extracted_data.discovery?.industry,
                    companySize: extracted_data.discovery?.companySize,
                    acquisitionFlow: extracted_data.discovery?.acquisitionFlow,
                    deliveryFlow: extracted_data.discovery?.deliveryFlow,
                    manualTasks: extracted_data.pain_points?.manualTasks,
                    hoursPerWeek: extracted_data.pain_points?.hoursPerWeek,
                    decisionBottlenecks: extracted_data.pain_points?.bottlenecks,
                    dataSilos: extracted_data.pain_points?.dataSilos,
                    visibilityGaps: "N/A",
                    budgetRange: extracted_data.pain_points?.budget,
                    timeline: extracted_data.pain_points?.timeline,
                    userRole: extracted_data.pain_points?.userRole,
                    name: contact_info.name,
                    email: contact_info.email,
                    company: contact_info.company,
                    painScore: painScore || 0,
                    estimatedValue: calculateEstimatedValue(opportunities),
                    roadmap: roadmap,
                    status: "completed",
                    currentPhase: "completed",
                    completionPercent: 100,
                },
                update: {
                    status: "completed",
                    currentPhase: "completed",
                    completionPercent: 100,
                    painScore: painScore || 0,
                    estimatedValue: calculateEstimatedValue(opportunities),
                    roadmap: roadmap,
                    updatedAt: new Date(),
                }
            });

            console.log(`[Notifications] Session data saved for ${state.sessionId}`);
        }

        return { 
            ...state, 
            current_step: "finished" as const 
        };

    } catch (error) {
        console.error("[Notifications] Error:", error);
        return { 
            ...state, 
            current_step: "finished" as const 
        };
    }
}

// Helper function to calculate estimated value
function calculateEstimatedValue(opportunities: any[]): number {
    if (!opportunities || opportunities.length === 0) return 0;
    
    return opportunities.reduce((total, opp) => {
        return total + (opp.monthlySavings * 12); // Annual savings
    }, 0);
}

// Helper functions from the original workflow

function determineCategoriesFromPainPoints(painPoints: any): string[] {
  const categories = new Set<string>();
  if (!painPoints) return [];

  const allText = `${painPoints.manualTasks} ${painPoints.bottlenecks} ${painPoints.dataSilos}`.toLowerCase();
  
  if (/lead|qualify|prospect|sales/.test(allText)) {
    categories.add("lead_gen");
  }
  if (/data entry|copy|paste|manual|update/.test(allText)) {
    categories.add("ops_automation");
  }
  if (/support|ticket|customer|help/.test(allText)) {
    categories.add("support");
  }
  if (/report|dashboard|visibility|kpi|metric/.test(allText)) {
    categories.add("analytics");
  }
  if (/system|integrate|sync|connect/.test(allText)) {
    categories.add("integration");
  }
  
  return Array.from(categories);
}

// Enhanced pain score calculation algorithm
function calculatePainScore(data: {
  manualTasks: string;
  bottlenecks: string;
  dataSilos: string;
  budget: string;
  timeline: string;
}): number {
  let score = 0;
  
  // Manual tasks analysis (0-30 points)
  const taskKeywords = ["manual", "manual data entry", "copy paste", "repetitive", "time-consuming"];
  const taskCount = taskKeywords.reduce((count, keyword) => {
    return count + (data.manualTasks.toLowerCase().split(keyword).length - 1);
  }, 0);
  score += Math.min(taskCount * 6, 30);
  
  // Bottlenecks analysis (0-25 points)
  const bottleneckKeywords = ["approval", "waiting", "delay", "bottleneck", "stuck"];
  const bottleneckCount = bottleneckKeywords.reduce((count, keyword) => {
    return count + (data.bottlenecks.toLowerCase().split(keyword).length - 1);
  }, 0);
  score += Math.min(bottleneckCount * 5, 25);
  
  // Data silos analysis (0-20 points)
  const siloKeywords = ["silo", "disconnected", "separate", "manual sync", "duplicate"];
  const siloCount = siloKeywords.reduce((count, keyword) => {
    return count + (data.dataSilos.toLowerCase().split(keyword).length - 1);
  }, 0);
  score += Math.min(siloCount * 4, 20);
  
  // Budget urgency (0-15 points)
  if (data.budget.toLowerCase().includes("urgent") || data.budget.toLowerCase().includes("asap")) {
    score += 15;
  } else if (data.budget.toLowerCase().includes("soon")) {
    score += 10;
  } else if (data.budget.toLowerCase().includes("exploring")) {
    score += 5;
  }
  
  // Timeline urgency (0-10 points)
  if (data.timeline.toLowerCase().includes("immediately") || data.timeline.toLowerCase().includes("asap")) {
    score += 10;
  } else if (data.timeline.toLowerCase().includes("1 month")) {
    score += 7;
  } else if (data.timeline.toLowerCase().includes("1-3 months")) {
    score += 5;
  }
  
  return Math.min(Math.round(score), 100);
}

// Fallback template matching when LLM fails
function fallbackTemplateMatching(templates: any[], painPoints: any): any[] {
  const categories = determineCategoriesFromPainPoints(painPoints);
  
  return templates
    .filter(t => categories.includes(t.category))
    .sort((a, b) => b.timesMatched - a.timesMatched) // Most popular first
    .slice(0, 3)
    .map((template, index) => ({
      templateId: template.id,
      matchScore: 80 - (index * 10), // Decreasing scores
      painPointsAddressed: categories,
      customProblemStatement: template.problemItSolves,
      customSolution: template.fullDescription,
      estimatedHoursSaved: template.avgTimeSavedHrsMonth,
      reasoning: "Template-based fallback matching"
    }));
}

function generateRoadmap(opportunities: any[]): any {
  const sorted = [...opportunities].sort((a: any, b: any) => {
    const difficultyOrder: { [key: string]: number } = { low: 1, medium: 2, high: 3 };
    return (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0);
  });
  
  const phases: any[] = [];
  let currentWeek = 0;
  
  sorted.forEach((opp: any, index: number) => {
    const startWeek = currentWeek;
    const endWeek = currentWeek + opp.implementationWeeks;
    
    phases.push({
      phase: index + 1,
      name: opp.name,
      startWeek,
      endWeek,
      duration: `${opp.implementationWeeks} weeks`,
      deliverables: [
        "Technical specification",
        "Development & testing",
        "Staging deployment",
        "Production launch",
        "Training & handoff"
      ],
      milestones: [
        { week: startWeek, title: "Kickoff & scoping" },
        { week: startWeek + Math.floor(opp.implementationWeeks / 2), title: "Staging review" },
        { week: endWeek, title: "Production launch" }
      ],
      expectedROI: `${opp.roi12Months}%`,
      monthlySavings: `$${opp.monthlySavings.toLocaleString()}`
    });
    
    currentWeek = endWeek;
  });
  
  const totalSavings = sorted.reduce((sum, opp) => sum + (opp.monthlySavings || 0), 0);
  const totalCost = sorted.reduce((sum, opp) => sum + (opp.devCostMid || 0), 0);
  const overallROI = totalCost > 0 ? Math.round(((totalSavings * 12 - totalCost) / totalCost) * 100) : 0;
  
  return {
    totalDuration: `${currentWeek} weeks (${Math.ceil(currentWeek / 4)} months)`,
    totalInvestment: `$${totalCost.toLocaleString()}`,
    totalMonthlySavings: `$${totalSavings.toLocaleString()}`,
    overallROI: `${overallROI}%`,
    phases,
    quickWins: sorted.filter((o: any) => o.difficulty === "low").map((o: any) => o.name),
    bigSwings: sorted.filter((o: any) => o.difficulty === "high").map((o: any) => o.name),
  };
}
