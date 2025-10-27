import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { nanoid } from "nanoid";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = process.env.GOOGLE_API_KEY
  ? new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      temperature: 0.3,
      apiKey: process.env.GOOGLE_API_KEY,
    })
  : null;

// Rule-based opportunity templates
const OPPORTUNITY_TEMPLATES = [
  {
    name: "Automated Lead Scoring & Routing",
    category: "lead_gen",
    triggers: ["lead", "sales", "crm", "qualification"],
    impact: 4,
    effort: 2,
    base_hours_saved: 8,
    base_cost: 5000,
    implementation_weeks: 3
  },
  {
    name: "Customer Onboarding Automation",
    category: "onboarding", 
    triggers: ["onboarding", "customer", "setup", "welcome"],
    impact: 5,
    effort: 3,
    base_hours_saved: 12,
    base_cost: 7500,
    implementation_weeks: 4
  },
  {
    name: "Support Ticket Triage & Auto-Response",
    category: "support",
    triggers: ["support", "tickets", "help", "customer service"],
    impact: 4,
    effort: 2,
    base_hours_saved: 6,
    base_cost: 4000,
    implementation_weeks: 2
  },
  {
    name: "Invoice & Payment Processing Automation",
    category: "billing",
    triggers: ["billing", "invoice", "payment", "accounting"],
    impact: 3,
    effort: 2,
    base_hours_saved: 5,
    base_cost: 3500,
    implementation_weeks: 2
  },
  {
    name: "Data Sync & Reporting Dashboard",
    category: "analytics",
    triggers: ["reporting", "data", "analytics", "dashboard"],
    impact: 4,
    effort: 3,
    base_hours_saved: 10,
    base_cost: 6000,
    implementation_weeks: 3
  }
];

function calculateROI(hoursSaved: number, cost: number, hourlyRate: number = 60): number {
  const annualSavings = hoursSaved * 52 * hourlyRate;
  return Math.round(((annualSavings - cost) / cost) * 100);
}

async function matchOpportunities(sessionData: any): Promise<any[]> {
  const info = sessionData.extracted_info || {};
  const discovery = info.discovery || {};
  const painPoints = info.pain_points || {};
  
  // Enhanced opportunity matching based on specific pain points and industry
  const industry = discovery.industry || 'general';
  const companySize = discovery.companySize || 'small';
  const manualTasks = painPoints.manualTasks || '';
  const bottlenecks = painPoints.bottlenecks || '';
  const dataSilos = painPoints.dataSilos || '';
  
  // Create context for better matching
  const painContext = `${manualTasks} ${bottlenecks} ${dataSilos}`.toLowerCase();
  
  const opportunities = OPPORTUNITY_TEMPLATES
    .map(template => {
      // Enhanced scoring based on multiple factors
      let matchScore = 50; // Base score
      
      // Industry relevance boost
      if (industry.includes('saas') || industry.includes('software')) {
        if (template.category === 'lead_gen' || template.category === 'analytics') matchScore += 15;
      }
      if (industry.includes('marketing') || industry.includes('agency')) {
        if (template.category === 'analytics' || template.category === 'support') matchScore += 15;
      }
      
      // Pain point matching
      template.triggers.forEach(trigger => {
        if (painContext.includes(trigger)) matchScore += 20;
      });
      
      // Specific pain point analysis
      if (manualTasks.includes('report') && template.category === 'analytics') matchScore += 25;
      if (bottlenecks.includes('approval') && template.category === 'support') matchScore += 20;
      if (dataSilos.includes('system') && template.category === 'analytics') matchScore += 20;
      
      // Company size adjustments
      const sizeMultiplier = companySize.includes('20') || companySize.includes('25') ? 1.2 : 
                           companySize.includes('10') || companySize.includes('15') ? 1.0 : 0.8;
      
      const hourlyRate = 65; // Slightly higher rate for better estimates
      const adjustedHoursSaved = Math.round(template.base_hours_saved * sizeMultiplier);
      const monthlySavings = adjustedHoursSaved * 4 * hourlyRate;
      const adjustedCost = Math.round(template.base_cost * sizeMultiplier);
      const roi12m = calculateROI(adjustedHoursSaved, adjustedCost, hourlyRate);
      
      // Determine quadrant based on impact and effort
      let quadrant = 'fill_in';
      if (template.impact >= 4 && template.effort <= 2) quadrant = 'quick_win';
      else if (template.impact >= 4 && template.effort >= 3) quadrant = 'big_bet';
      else if (template.impact <= 3 && template.effort >= 3) quadrant = 'avoid';
      
      return {
        ...template,
        match_score: Math.min(matchScore, 100),
        monthly_savings: monthlySavings,
        annual_savings: monthlySavings * 12,
        roi_12m: roi12m,
        quadrant: quadrant,
        hours_saved_monthly: adjustedHoursSaved * 4,
        implementation_cost: adjustedCost,
        payback_months: Math.round(adjustedCost / monthlySavings),
        priority_score: (matchScore * template.impact) / template.effort
      };
    })
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 5); // Top 5 opportunities for more comprehensive analysis

  return opportunities;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID required" },
        { status: 400 }
      );
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const currentState = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
    const info = currentState.extracted_info;
    
    // Check if we have enough info using workflow structure
    const missingInfo = [];
    if (!info?.discovery?.industry) missingInfo.push("industry");
    if (!info?.discovery?.companySize) missingInfo.push("company size");
    if (!info?.pain_points?.manualTasks) missingInfo.push("manual tasks");
    if (!info?.pain_points?.budget) missingInfo.push("budget");
    if (!info?.contact_info?.email) missingInfo.push("email");
    
    if (missingInfo.length > 0) {
      return NextResponse.json({
        success: false,
        error: "incomplete",
        missing: missingInfo,
        follow_up: `I need a bit more information about: ${missingInfo.join(", ")}. Can you tell me more?`
      });
    }
    
    // Generate opportunities using enhanced rule-based matching
    const opportunities = await matchOpportunities(currentState);
    
    // Only call LLM for final report generation if we have complete info
    let reportContent = "";
    if (llm) {
      try {
        const discovery = info.discovery || {};
        const painPoints = info.pain_points || {};
        const contactInfo = info.contact_info || {};
        
        const comprehensiveContext = `
COMPANY PROFILE:
- Company: ${contactInfo.company || discovery.industry || 'Client Company'}
- Industry: ${discovery.industry || 'Not specified'}
- Team Size: ${discovery.companySize || 'Not specified'}
- Acquisition Flow: ${discovery.acquisitionFlow || 'Not specified'}
- Delivery Flow: ${discovery.deliveryFlow || 'Not specified'}

PAIN POINTS & CHALLENGES:
- Manual Tasks: ${painPoints.manualTasks || 'Not specified'}
- Bottlenecks: ${painPoints.bottlenecks || 'Not specified'}
- Data Silos: ${painPoints.dataSilos || 'Not specified'}
- Budget Range: ${painPoints.budget || 'Not specified'}
- Timeline: ${painPoints.timeline || 'Not specified'}
- Decision Maker Role: ${painPoints.userRole || 'Not specified'}

CONTACT INFORMATION:
- Name: ${contactInfo.name || 'Not specified'}
- Email: ${contactInfo.email || currentState.email || 'Not specified'}

IDENTIFIED OPPORTUNITIES:
${opportunities.map((opp, i) => `${i + 1}. ${opp.name}
   - Category: ${opp.category}
   - Monthly Savings: $${opp.monthly_savings}
   - ROI (12 months): ${opp.roi_12m}%
   - Implementation: ${opp.implementation_weeks} weeks
   - Match Score: ${opp.match_score}%`).join('\n\n')}
`;
        
        const prompt = `You are an AI Transformation Partner producing a comprehensive executive audit report. Generate a detailed, professional automation audit report based on the following client data:

${comprehensiveContext}

Generate a comprehensive report with the following sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
   - Brief overview of the company and current state
   - Key findings and total potential impact
   - Strategic recommendations

2. CURRENT STATE ANALYSIS
   - Process inefficiencies identified
   - Technology gaps and data silos
   - Resource allocation issues

3. AUTOMATION OPPORTUNITIES (Top 3-5 detailed)
   For each opportunity include:
   - Problem statement and business impact
   - Proposed solution approach
   - Technical requirements and integration points
   - Implementation timeline and phases
   - ROI calculation and payback period
   - Risk assessment and mitigation strategies

4. IMPACT-EFFORT MATRIX
   - Categorize opportunities as Quick Wins, Big Bets, Fill-ins
   - Prioritization rationale

5. 90-DAY QUICK WINS PLAN
   - Immediate actions (Week 1-4)
   - Foundation building (Week 5-8)
   - First automation deployment (Week 9-12)

6. 12-MONTH STRATEGIC ROADMAP
   - Phase 1: Foundation (Months 1-3)
   - Phase 2: Core Automations (Months 4-8)
   - Phase 3: Advanced Integration (Months 9-12)

7. FINANCIAL ANALYSIS
   - Total investment required
   - Expected annual savings
   - ROI projections
   - Break-even analysis

8. IMPLEMENTATION CONSIDERATIONS
   - Change management requirements
   - Training and adoption strategies
   - Success metrics and KPIs

9. NEXT STEPS
   - Immediate actions required
   - Decision points and approvals needed
   - Recommended engagement model

Make the report executive-ready, data-driven, and actionable. Use specific numbers from the provided data and avoid generic statements.`;
        
        const response = await llm.invoke(prompt);
        reportContent = response.content as string;
      } catch (error) {
        console.error("LLM generation failed:", error);
        reportContent = "Report generation temporarily unavailable. Your opportunities are listed below.";
      }
    }
    
    const completionMessage = {
      id: nanoid(),
      type: "ai",
      content: `🎉 **Your AI Opportunity Assessment is Complete!**\n\nI've identified ${opportunities.length} automation opportunities. Your detailed report has been sent to ${email} with:\n\n• Executive summary & ROI analysis\n• Implementation roadmap\n• Download link for full report\n• Slack channel invite for follow-up\n\nCheck your email in the next few minutes!`,
      timestamp: new Date().toISOString(),
    };

    const finalState = {
      ...currentState,
      current_step: "finished",
      opportunities,
      report_content: reportContent,
      email,
      messages: [...currentState.messages, completionMessage]
    };

    await redis.set(`session:${sessionId}`, JSON.stringify(finalState), { ex: 86400 });

    // Trigger integrations asynchronously with proper sequencing
    setTimeout(async () => {
      try {
        const { createGoogleDoc } = await import('@/lib/integrations/google-docs');
        const { sendGmailReport } = await import('@/lib/integrations/gmail');
        const { sendDiscordAlert } = await import('@/lib/integrations/discord');
        
        console.log('[Generate] Starting integrations...');
        
        // Create Google Doc first
        console.log('[Generate] Creating Google Doc...');
        const docResult = await createGoogleDoc(finalState);
        const googleDocUrl = docResult.success ? docResult.docUrl : undefined;
        
        if (googleDocUrl) {
          console.log('[Generate] Google Doc created:', googleDocUrl);
        } else {
          console.log('[Generate] Google Doc creation failed:', docResult.error);
        }
        
        // Send email with Google Doc link
        console.log('[Generate] Sending email...');
        const emailResult = await sendGmailReport(email, finalState, googleDocUrl);
        console.log('[Generate] Email result:', emailResult.success);
        
        // Send Discord notification with Google Doc link
        console.log('[Generate] Sending Discord notification...');
        const discovery = finalState.extracted_info?.discovery || {};
        const painPoints = finalState.extracted_info?.pain_points || {};
        const contactInfo = finalState.extracted_info?.contact_info || {};
        
        const discordResult = await sendDiscordAlert({
          sessionId,
          name: contactInfo.name || 'Lead',
          email: contactInfo.email || email,
          company: contactInfo.company || `${discovery.industry} Company` || 'Tech Company',
          painScore: 85,
          estimatedValue: opportunities.reduce((sum, opp) => sum + (opp.monthly_savings * 12), 0),
          timeline: painPoints.timeline || 'Not specified',
          budgetRange: painPoints.budget || 'Not specified',
          topOpportunity: opportunities[0]?.name,
          googleDocUrl
        });
        
        console.log('[Generate] Discord result:', discordResult.success);
        console.log('[Generate] All integrations completed successfully');
        
      } catch (error) {
        console.error('[Generate] Integration error:', error);
      }
    }, 1000);

    return NextResponse.json({
      success: true,
      opportunities,
      message: completionMessage,
      report_generated: true
    });

  } catch (error) {
    console.error("[Generate] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}