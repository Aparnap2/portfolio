import { z } from "zod";
import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import {
  SYSTEM_PROMPT,
  discoverySchema,
  painPointsSchema,
  contactInfoSchema,
} from "@/lib/ai/prompts";

// Import types from feasibility checks
import type { TechnicalScore, OrganizationalScore } from "./feasibility-checks";

// ============================================
// STATE DEFINITION
// ============================================

// Define state using Annotation.Root
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => y, // Overwrite messages with new list
    default: () => [],
  }),
  current_step: Annotation<"discovery" | "pain_points" | "contact_info" | "process_mapping" | "opportunity_mining" | "feasibility_check" | "roi_calculation" | "report_generation" | "processing" | "finished">({
    reducer: (x, y) => y,
    default: () => "discovery",
  }),
  extracted_data: Annotation<{
    discovery?: z.infer<typeof discoverySchema>;
    pain_points?: z.infer<typeof painPointsSchema>;
    contact_info?: z.infer<typeof contactInfoSchema>;
  }>({
    reducer: (x, y) => ({...x, ...y}),
    default: () => ({}),
  }),
  processes: Annotation<{
    map: any[]; // Process map with swimlanes
    bottlenecks: any[]; // Identified bottlenecks
    baselines: { volumes: number; cycleTime: number; errors: number };
  }>({
    reducer: (x, y) => ({...x, ...y}),
    default: () => ({ map: [], bottlenecks: [], baselines: { volumes: 0, cycleTime: 0, errors: 0 } }),
  }),
  opportunities: Annotation<{
    raw: any[]; // Initial opportunities from pain points
    categorized: { // LangGraph tool schema format
      automation: any[];
      agent: any[];
      rag: any[];
      integration: any[];
      toolSwap: any[];
    };
  }>({
    reducer: (x, y) => ({...x, ...y}),
    default: () => ({ raw: [], categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] } }),
  }),
  feasibility: Annotation<{
    scores: { opportunityId: string; technical: TechnicalScore; org: OrganizationalScore; overallScore: number; overallStatus: 'green'|'amber'|'red'; blockers: string[]; recommendations: string[] }[];
    blockers: string[];
  }>({
    reducer: (x, y) => y,
    default: () => ({ scores: [], blockers: [] }),
  }),
  roi: Annotation<{
    scenarios: {
      conservative: { savings: number; breakeven: number; monthlySavings: number; implementationCost: number; annualROI: number; confidence: string };
      base: { savings: number; breakeven: number; monthlySavings: number; implementationCost: number; annualROI: number; confidence: string };
      aggressive: { savings: number; breakeven: number; monthlySavings: number; implementationCost: number; annualROI: number; confidence: string };
    };
    roadmap: { quickWins: any[]; bigSwings: any[]; phases: any[] };
  }>({
    reducer: (x, y) => y,
    default: () => ({ scenarios: { conservative: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: 'conservative' }, base: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: 'base' }, aggressive: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: 'aggressive' } }, roadmap: { quickWins: [], bigSwings: [], phases: [] } }),
  }),
  roadmap: Annotation<any>({
    reducer: (x, y) => y,
    default: () => null,
  }),
  painScore: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  sessionId: Annotation<string | undefined>({
    reducer: (x, y) => y,
    default: () => undefined,
  }),
  integrations: Annotation<{
    hubspot?: { contactId: string; dealId: string };
    calendar?: { eventId: string; meetLink: string };
    gmail?: { messageId: string };
    discord?: { messageId: string };
  }>({
    reducer: (x, y) => ({...x, ...y}),
    default: () => ({}),
  }),
});

// Exporting for use in audit-processing.ts
export type AuditState = typeof StateAnnotation.State;

// ============================================
// LLM & TOOL SETUP
// ============================================

// Enhanced tool definition for LangGraph
const extractionTool = {
  name: "extract_data",
  description: "Extract structured data from user responses and move to next audit phase",
  input_schema: {
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
};

const llm = process.env.GOOGLE_API_KEY
  ? new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro",
      temperature: 0.3,
      apiKey: process.env.GOOGLE_API_KEY,
    })
  : (() => {
      throw new Error("GOOGLE_API_KEY is not set.");
    })();

// Embeddings for semantic matching
export const embeddings = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: process.env.GOOGLE_API_KEY,
    })
  : null;

const llmWithTool = llm.bind({
  tools: [extractionTool],
});

// ============================================
// GRAPH NODES
// ============================================

async function callAgent(state: AuditState): Promise<Partial<AuditState>> {
  const { messages, current_step } = state;
  console.log(`--- Calling Agent for Step: ${current_step} ---`);

  const prompt = `You are in "${current_step}" step of the audit.

Conversation History:
${messages
    .map((m) => `${m.getType()}: ${m.content}`)
    .join("\n")}`;

  const response = await llmWithTool.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);

  return { messages: [...state.messages, response] };
}

async function processExtractedData(state: AuditState): Promise<Partial<AuditState>> {
  const { messages, extracted_data } = state;
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
        next_step = "processing"; // Hand off to backend processing
        break;
    }

    return {
      extracted_data: updated_extracted_data,
      current_step: next_step,
    };
  } catch (error: any) {
    const errorMessage = new AIMessage({
      content: `There was an error parsing data for step '${step}'. Please try again. Error: ${error.message}`,
    });
    return { messages: [...messages, errorMessage] };
  }
}

// ============================================
// CONDITIONAL EDGES
// ============================================

function shouldCallTool(state: AuditState): "process_data" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage && 'tool_calls' in lastMessage && (lastMessage as any).tool_calls && (lastMessage as any).tool_calls.length > 0) {
    return "process_data";
  }
  return END;
}

function shouldContinue(state: AuditState): "call_agent" | "run_processing" | typeof END {
  if (state.current_step === 'processing') {
        return "run_processing";
    }
    if (state.current_step === 'finished') {
        return END;
    }
    return "call_agent";
}

// ============================================
// GRAPH DEFINITION
// ============================================

const workflow = new StateGraph(StateAnnotation)
  .addNode("call_agent", callAgent)
  .addNode("process_data", processExtractedData)
  .addNode("map_process", async (state) => {
    const { mapProcessFromAnswers } = await import("./process-mapping");
    return mapProcessFromAnswers(state);
  })
  .addNode("mine_opportunities", async (state) => {
    const { categorizeOpportunities } = await import("./opportunity-mining");
    return categorizeOpportunities(state);
  })
  .addNode("check_feasibility", async (state) => {
    const { checkFeasibility } = await import("./feasibility-checks");
    return checkFeasibility(state);
  })
  .addNode("calculate_roi", async (state) => {
    const { calculateROI } = await import("./roi-calculator");
    return calculateROI(state);
  })
  .addNode("match_opportunities", async (state) => {
    const { matchOpportunities } = await import("./audit-processing");
    return matchOpportunities(state);
  })
  .addNode("generate_report", async (state) => {
    const { generateReport } = await import("./audit-processing");
    const { triggerIntegrations } = await import("./audit-processing");
    const reportState = await generateReport(state);
    const integrationState = await triggerIntegrations(state);
    return { ...reportState, ...integrationState };
  })
  .addNode("send_notifications", async (state) => {
    const { sendNotifications } = await import("./audit-processing");
    return sendNotifications(state);
  })
  .addEdge(START, "call_agent")
  .addConditionalEdges("call_agent", shouldCallTool, {
    process_data: "process_data",
    [END]: END,
  })
  .addConditionalEdges("process_data", shouldContinue, {
    call_agent: "call_agent",
    run_processing: "map_process",
    [END]: END,
  })
  .addEdge("map_process", "mine_opportunities")
  .addEdge("mine_opportunities", "check_feasibility")
  .addEdge("check_feasibility", "calculate_roi")
  .addEdge("calculate_roi", "match_opportunities")
  .addEdge("match_opportunities", "generate_report")
  .addEdge("generate_report", "send_notifications")
  .addEdge("send_notifications", END);

// ============================================
// COMPILE & EXPORT
// ============================================

export const compiledAuditWorkflow = workflow.compile();
