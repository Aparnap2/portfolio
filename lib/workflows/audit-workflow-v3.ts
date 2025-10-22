import { z } from "zod";
import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MemorySaver } from "@langchain/langgraph";

import {
    SYSTEM_PROMPT,
    discoverySchema,
    painPointsSchema,
    contactInfoSchema,
} from "@/lib/ai/prompts";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

// ============================================
// MEMORY CHECKPOINTER SETUP (PRD aligned)
// ============================================

const checkpointer = new MemorySaver();

// ============================================
// STATE DEFINITION (Aligned with PRD)
// ============================================

interface AuditState {
    messages: BaseMessage[];
    current_step: "discovery" | "pain_points" | "contact_info" | "processing" | "finished";
    extracted_data: {
        discovery?: z.infer<typeof discoverySchema>;
        pain_points?: z.infer<typeof painPointsSchema>;
        contact_info?: z.infer<typeof contactInfoSchema>;
    };
    opportunities: any[];
    roadmap: any;
    painScore: number;
    sessionId?: string;
    // Database fields (from PRD schema)
    industry?: string;
    companySize?: string;
    acquisitionFlow?: string;
    deliveryFlow?: string;
    currentSystems?: any;
    manualTasks?: string;
    hoursPerWeek?: number;
    avgHourlyRate?: number;
    decisionBottlenecks?: string;
    dataSilos?: string;
    visibilityGaps?: string;
    budgetRange?: string;
    timeline?: string;
    userRole?: string;
    name?: string;
    email?: string;
    company?: string;
    phone?: string;
    estimatedValue?: number;
}

// ============================================
// LLM & TOOL SETUP
// ============================================

const extractionTool = {
    type: "function",
    function: {
        name: "extract_data",
        description: "Extract structured data from user responses and move to next audit phase",
        parameters: {
            type: "object",
            properties: {
                step: {
                    type: "string",
                    enum: ["discovery", "pain_points", "contact_info"],
                    description: "The current audit step being completed"
                },
                data: {
                    type: "object",
                    description: "The extracted data for this step"
                }
            },
            required: ["step", "data"]
        }
    }
};

const llm = process.env.GOOGLE_API_KEY
    ? new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash-exp",
        temperature: 0.3,
        apiKey: process.env.GOOGLE_API_KEY,
    })
    : (() => {
        throw new Error("GOOGLE_API_KEY is not set.");
    })();

// For newer LangGraph versions, we handle tools differently
const llmWithTool = llm.bindTools([extractionTool]);

// ============================================
// DATABASE PERSISTENCE HELPER FUNCTIONS
// ============================================

async function savePartialAuditSession(sessionId: string, data: Partial<AuditState>) {
    try {
        // Update or create the audit session
        const updateData: any = {
            updatedAt: new Date(),
        };

        // Map extracted data to database fields
        if (data.extracted_data?.discovery) {
            const discovery = data.extracted_data.discovery;
            updateData.industry = discovery.industry;
            updateData.companySize = discovery.companySize;
            updateData.acquisitionFlow = discovery.acquisitionFlow;
            updateData.deliveryFlow = discovery.deliveryFlow;
        }

        if (data.extracted_data?.pain_points) {
            const painPoints = data.extracted_data.pain_points;
            updateData.manualTasks = painPoints.manualTasks;
            updateData.decisionBottlenecks = painPoints.bottlenecks;
            updateData.dataSilos = painPoints.dataSilos;
            updateData.budgetRange = painPoints.budget;
            updateData.timeline = painPoints.timeline;
            updateData.userRole = painPoints.userRole;
        }

        if (data.extracted_data?.contact_info) {
            const contactInfo = data.extracted_data.contact_info;
            updateData.name = contactInfo.name;
            updateData.email = contactInfo.email;
            updateData.company = contactInfo.company;
        }

        // Update current phase and completion percentage
        const phasePercentages = {
            discovery: 33,
            pain_points: 66,
            contact_info: 80,
            processing: 90,
            finished: 100,
        };

        updateData.currentPhase = data.current_step;
        updateData.completionPercent = data.current_step ? phasePercentages[data.current_step] : 0;

        // Calculate pain score and estimated value (PRD logic)
        if (data.extracted_data?.pain_points) {
            const painPoints = data.extracted_data.pain_points;
            updateData.painScore = calculatePainScore(painPoints);
            updateData.estimatedValue = calculateEstimatedValue(painPoints);
        }

        // Update session in database
        await db.auditSession.upsert({
            where: { sessionId },
            update: updateData,
            create: {
                sessionId,
                currentPhase: data.current_step || "discovery",
                completionPercent: updateData.completionPercent,
                status: "in_progress",
                ...updateData,
            }
        });

        console.log(`[DB] Saved partial session for ${sessionId}, phase: ${data.current_step}`);

    } catch (error) {
        console.error('[DB] Error saving partial session:', error);
        throw error;
    }
}

function calculatePainScore(painPoints: any): number {
    let score = 0;

    // Score from manual tasks (0-40 points)
    const manualTasksLength = painPoints.manualTasks?.length || 0;
    score += Math.min(manualTasksLength * 2, 40);

    // Score from bottlenecks (0-30 points)
    const bottlenecksLength = painPoints.bottlenecks?.length || 0;
    score += Math.min(bottlenecksLength * 3, 30);

    // Score from data silos (0-30 points)
    const dataSilosLength = painPoints.dataSilos?.length || 0;
    score += Math.min(dataSilosLength * 3, 30);

    return Math.min(Math.round(score), 100);
}

function calculateEstimatedValue(painPoints: any): number {
    // Conservative estimation based on pain described
    const hoursPerWeek = 20; // Default estimate
    const avgHourlyRate = 60; // From PRD default
    const monthlyCost = hoursPerWeek * 4 * avgHourlyRate;

    // Typically, clients will pay for ~60% of their pain cost
    return Math.round(monthlyCost * 0.6);
}

// ============================================
// GRAPH NODES
// ============================================

async function callAgent(state: AuditState): Promise<Partial<AuditState>> {
    const { messages, current_step } = state;
    console.log(`--- Calling Agent for Step: ${current_step} ---`);
    console.log(`--- Message count: ${messages.length} ---`);

    const prompt = `You are in "${current_step}" step of the audit.

Conversation History:
${messages
            .map((m) => `${m.getType()}: ${m.content}`)
            .join("\n")}`;

    const response = await llmWithTool.invoke([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
    ]);

    console.log(`--- AI Response type: ${response.getType()} ---`);
    if ('tool_calls' in response && (response as any).tool_calls) {
        console.log(`--- Tool calls: ${JSON.stringify((response as any).tool_calls)} ---`);
    } else {
        console.log(`--- No tool calls in response ---`);
    }

    return { messages: [...state.messages, response] };
}

async function processExtractedData(state: AuditState): Promise<Partial<AuditState>> {
    const { messages, extracted_data, sessionId } = state;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    const toolCall = lastMessage.tool_calls?.[0];

    if (!toolCall || toolCall.name !== "extract_data") {
        return { messages: [...messages, new AIMessage({ content: "Error: Expected a tool call." })] };
    }

    const { step, data } = toolCall.args as { step: string; data: any };
    let next_step = state.current_step;
    const updated_extracted_data = { ...extracted_data };

    console.log(`--- Processing Extracted Data for Step: ${step} ---`);

    try {
        switch (step) {
            case "discovery":
                updated_extracted_data.discovery = discoverySchema.parse(data);
                next_step = "pain_points";
                break;
            case "pain_points":
                updated_extracted_data.pain_points = painPointsSchema.parse(data);
                next_step = "contact_info";
                break;
            case "contact_info":
                updated_extracted_data.contact_info = contactInfoSchema.parse(data);
                next_step = "processing";
                break;
        }

        const updatedState: Partial<AuditState> = {
            extracted_data: updated_extracted_data,
            current_step: next_step,
        };

        // Save to database with partial data (PRD requirement)
        if (sessionId) {
            await savePartialAuditSession(sessionId, updatedState);
        }

        return updatedState;

    } catch (error: any) {
        const errorMessage = new AIMessage({
            content: `There was an error parsing data for step '${step}'. Please try again. Error: ${error.message}`,
        });
        return { messages: [...messages, errorMessage] };
    }
}

async function processOpportunities(state: AuditState): Promise<Partial<AuditState>> {
    console.log(`--- Processing Opportunities for session: ${state.sessionId} ---`);

    const opportunities = [
        {
            name: "Automated Lead Scoring",
            category: "lead_gen",
            hoursSavedPerMonth: 40,
            monthlySavings: 2400,
            devCostMid: 8000,
            implementationWeeks: 4,
            matchScore: 95,
            roi12Months: 260
        },
        {
            name: "Inventory Sync Automation",
            category: "ops_automation",
            hoursSavedPerMonth: 30,
            monthlySavings: 1800,
            devCostMid: 6000,
            implementationWeeks: 3,
            matchScore: 88,
            roi12Months: 260
        }
    ];

    const roadmap = {
        totalDuration: "7 weeks (2 months)",
        phases: [
            {
                phase: 1,
                name: "Automated Lead Scoring",
                duration: "4 weeks"
            },
            {
                phase: 2,
                name: "Inventory Sync Automation",
                duration: "3 weeks"
            }
        ]
    };

    const finalState: Partial<AuditState> = {
        ...state,
        opportunities,
        roadmap,
        current_step: "finished" as const
    };

    // Save final state to database
    if (state.sessionId) {
        try {
            await db.auditSession.update({
                where: { sessionId: state.sessionId },
                data: {
                    currentPhase: "completed",
                    completionPercent: 100,
                    status: "completed",
                    opportunities: {
                        create: opportunities.map((opp, index) => ({
                            templateId: "template-" + index, // Would link to real templates
                            name: opp.name,
                            problemStatement: `Addresses ${opp.category} challenges`,
                            solutionDescription: `Automated solution for ${opp.name}`,
                            category: opp.category,
                            difficulty: "medium",
                            hoursSavedPerMonth: opp.hoursSavedPerMonth,
                            monthlySavings: opp.monthlySavings,
                            devCostMin: Math.round(opp.devCostMid * 0.8),
                            devCostMax: Math.round(opp.devCostMid * 1.2),
                            devCostMid: opp.devCostMid,
                            implementationWeeks: opp.implementationWeeks,
                            breakevenMonths: opp.devCostMid / opp.monthlySavings,
                            roi12Months: opp.roi12Months,
                            matchScore: opp.matchScore,
                            rank: index + 1,
                            painPointsMatched: state.extracted_data.pain_points ? [Object.keys(state.extracted_data.pain_points)] : [],
                            systemsRequired: ["HubSpot", "Database"],
                        }))
                    },
                    roadmap,
                    updatedAt: new Date(),
                }
            });

            console.log(`[DB] Finalized session ${state.sessionId} in database`);
        } catch (error) {
            console.error('[DB] Error finalizing session:', error);
        }
    }

    return finalState;
}

// ============================================
// CONDITIONAL EDGES
// ============================================

function shouldCallTool(state: AuditState): "process_data" | typeof END {
    const lastMessage = state.messages[state.messages.length - 1];
    console.log(`[shouldCallTool] Checking last message type: ${lastMessage?.getType()}`);

    if (lastMessage && 'tool_calls' in lastMessage && (lastMessage as any).tool_calls && (lastMessage as any).tool_calls.length > 0) {
        console.log(`[shouldCallTool] Found tool calls, routing to process_data`);
        return "process_data";
    }

    console.log(`[shouldCallTool] No tool calls, routing to END`);
    return END;
}

function shouldContinue(state: AuditState): "call_agent" | "process_opportunities" | typeof END {
    if (state.current_step === 'processing') {
        return "process_opportunities";
    }
    if (state.current_step === 'finished') {
        return END;
    }
    return "call_agent";
}

// ============================================
// GRAPH DEFINITION (PRD-Aligned with PostgreSQL)
// ============================================

// Define state using Annotation.Root (LangGraph v0.4.9 API)
const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (_x, y) => y,
        default: () => [],
    }),
    current_step: Annotation<"discovery" | "pain_points" | "contact_info" | "processing" | "finished">({
        reducer: (_x, y) => y,
        default: () => "discovery",
    }),
    extracted_data: Annotation<{
        discovery?: z.infer<typeof discoverySchema>;
        pain_points?: z.infer<typeof painPointsSchema>;
        contact_info?: z.infer<typeof contactInfoSchema>;
    }>({
        reducer: (x, y) => ({ ...x, ...y }),
        default: () => ({}),
    }),
    opportunities: Annotation<any[]>({
        reducer: (_x, y) => y,
        default: () => [],
    }),
    roadmap: Annotation<any>({
        reducer: (_x, y) => y,
        default: () => null,
    }),
    painScore: Annotation<number>({
        reducer: (_x, y) => y,
        default: () => 0,
    }),
    sessionId: Annotation<string | undefined>({
        reducer: (_x, y) => y,
        default: () => undefined,
    }),
});

const workflow = new StateGraph(StateAnnotation);

// Add nodes
workflow.addNode("call_agent", callAgent);
workflow.addNode("process_data", processExtractedData);
workflow.addNode("process_opportunities", processOpportunities);

// Add edges
workflow.addEdge(START, "call_agent" as any);
workflow.addConditionalEdges("call_agent" as any, shouldCallTool, {
    process_data: "process_data" as any,
    [END]: END,
} as any);
workflow.addConditionalEdges("process_data" as any, shouldContinue, {
    call_agent: "call_agent" as any,
    process_opportunities: "process_opportunities" as any,
    [END]: END,
} as any);
workflow.addEdge("process_opportunities" as any, END);

// ============================================
// COMPILE & EXPORT (WITH POSTGRES PERSISTENCE)
// ============================================

export const compiledAuditWorkflowV3 = workflow.compile({
    checkpointer,
});

export type { AuditState };
