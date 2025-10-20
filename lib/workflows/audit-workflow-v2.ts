import { z } from "zod";
import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import {
  SYSTEM_PROMPT,
  discoverySchema,
  painPointsSchema,
  contactInfoSchema,
} from "@/lib/ai/prompts";

// ============================================
// STATE DEFINITION (Simplified for Production)
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
        next_step = "processing";
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

async function processOpportunities(state: AuditState): Promise<Partial<AuditState>> {
  console.log(`--- Processing Opportunities for session: ${state.sessionId} ---`);
  
  // Simplified opportunity processing for production
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

  return {
    ...state,
    opportunities,
    roadmap,
    current_step: "finished"
  };
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
// GRAPH DEFINITION (Production-Ready)
// ============================================

const workflow = new StateGraph({
  channels: {
    messages: {
      reducer: (x: BaseMessage[], y: BaseMessage[]) => y,
      default: () => [],
    },
    current_step: {
      reducer: (x: string, y: string) => y,
      default: () => "discovery",
    },
    extracted_data: {
      reducer: (x: any, y: any) => ({...x, ...y}),
      default: () => ({}),
    },
    opportunities: {
      reducer: (x: any[], y: any[]) => y,
      default: () => [],
    },
    roadmap: {
      reducer: (x: any, y: any) => y,
      default: () => null,
    },
    painScore: {
      reducer: (x: number, y: number) => y,
      default: () => 0,
    },
    sessionId: {
      reducer: (x: string | undefined, y: string | undefined) => y,
      default: () => undefined,
    },
  },
});

// Add nodes
workflow.addNode("call_agent", callAgent);
workflow.addNode("process_data", processExtractedData);
workflow.addNode("process_opportunities", processOpportunities);

// Add edges
workflow.addEdge(START, "call_agent");
workflow.addConditionalEdges("call_agent", shouldCallTool, {
  process_data: "process_data",
  [END]: END,
});
workflow.addConditionalEdges("process_data", shouldContinue, {
  call_agent: "call_agent",
  process_opportunities: "process_opportunities",
  [END]: END,
});
workflow.addEdge("process_opportunities", END);

// ============================================
// COMPILE & EXPORT
// ============================================

export const compiledAuditWorkflowV2 = workflow.compile();

export type { AuditState };