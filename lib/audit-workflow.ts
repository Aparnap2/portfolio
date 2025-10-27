import { StateGraph, END } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

// Define the state
interface AppState {
  messages: BaseMessage[];
  currentPhase: "discovery" | "pain_points" | "qualification" | "finish";
  discoveryData?: { industry: string; companySize: string; };
  painPointsData?: { manualTasks: string; bottlenecks: string; dataSilos: string; };
  qualificationData?: { budget: string; timeline: string; };
}

// Define Zod schemas for structured output
const discoverySchema = z.object({
  industry: z.string().describe("The user's industry"),
  companySize: z.string().describe("The size of the user's company"),
});

const painPointsSchema = z.object({
  manualTasks: z.string().describe("Description of manual tasks"),
  bottlenecks: z.string().describe("Description of bottlenecks"),
  dataSilos: z.string().describe("Description of data silos"),
});

const qualificationSchema = z.object({
    budget: z.string().describe("The user's budget"),
    timeline: z.string().describe("The user's timeline"),
});

// Define the model
const model = new ChatGoogleGenerativeAI({ model: "gemini-2.5-flash" });

// Define the graph
const workflow = new StateGraph<AppState>({
  channels: {
    messages: {
      value: (x, y) => x.concat(y),
      default: () => [],
    },
    currentPhase: {
      value: (x, y) => y,
      default: () => "discovery",
    },
    discoveryData: {
        value: (x, y) => y,
        default: () => undefined,
    },
    painPointsData: {
        value: (x, y) => y,
        default: () => undefined,
    },
    qualificationData: {
        value: (x, y) => y,
        default: () => undefined,
    },
  },
});

// Start node
export const startNode = async (state: AppState) => {
  return {
    messages: [new AIMessage("Hi! I'm here to conduct a quick 3-step AI opportunity assessment for your business. Let's start with understanding your business. What industry are you in, and how many employees do you have?")],
  };
};

// Discovery node
export const discoveryNode = async (state: AppState, model: ChatGoogleGenerativeAI) => {
    const { messages } = state;
    const structuredLLM = model.withStructuredOutput(discoverySchema);
    const response = await structuredLLM.invoke(messages);

    if (!response.industry || !response.companySize) {
        return {
            messages: [new AIMessage("I'm sorry, I didn't catch that. Please tell me about your industry and company size.")],
        }
    }

    return {
        discoveryData: response,
        messages: [new AIMessage("Thanks for sharing! Now, let's talk about your challenges. What are the main pain points in your business? (e.g., manual tasks, bottlenecks, data silos)")]
    }
}

// Pain points node
export const painPointsNode = async (state: AppState, model: ChatGoogleGenerativeAI) => {
    const { messages } = state;
    const structuredLLM = model.withStructuredOutput(painPointsSchema);
    const response = await structuredLLM.invoke(messages);

    if (!response.manualTasks || !response.bottlenecks || !response.dataSilos) {
        return {
            messages: [new AIMessage("I'm sorry, I need a bit more detail. Please describe your manual tasks, bottlenecks, and data silos.")],
        }
    }

    return {
        painPointsData: response,
        messages: [new AIMessage("Got it. Finally, let's talk about your budget and timeline for this project.")]
    }
}

// Qualification node
export const qualificationNode = async (state: AppState, model: ChatGoogleGenerativeAI) => {
    const { messages } = state;
    const structuredLLM = model.withStructuredOutput(qualificationSchema);
    const response = await structuredLLM.invoke(messages);

    if (!response.budget || !response.timeline) {
        return {
            messages: [new AIMessage("I'm sorry, I didn't catch that. Please tell me about your budget and timeline.")],
        }
    }

    return {
        qualificationData: response,
    }
}

// Finish node
export const finishNode = async (state: AppState) => {
    const { discoveryData, painPointsData, qualificationData } = state;
    const summary = `
        Here is a summary of your AI opportunity assessment:
        - Industry: ${discoveryData?.industry}
        - Company Size: ${discoveryData?.companySize}
        - Manual Tasks: ${painPointsData?.manualTasks}
        - Bottlenecks: ${painPointsData?.bottlenecks}
        - Data Silos: ${painPointsData?.dataSilos}
        - Budget: ${qualificationData?.budget}
        - Timeline: ${qualificationData?.timeline}
    `;

    return {
        messages: [new AIMessage(summary)],
    }
}

// Define conditional edge
const shouldContinue = (state: AppState) => {
    if (state.qualificationData?.budget && state.qualificationData?.timeline) {
        return "finish";
    }
    if (state.painPointsData?.manualTasks && state.painPointsData?.bottlenecks && state.painPointsData?.dataSilos) {
        return "qualification";
    }
    if (state.discoveryData?.industry && state.discoveryData?.companySize) {
        return "pain_points";
    }
    return "discovery";
}

// Add nodes
workflow.addNode("start", startNode);
workflow.addNode("discovery", (state) => discoveryNode(state, model));
workflow.addNode("pain_points", (state) => painPointsNode(state, model));
workflow.addNode("qualification", (state) => qualificationNode(state, model));
workflow.addNode("finish", finishNode);

// Define edges
workflow.setEntryPoint("start");
workflow.addEdge("start", "discovery");
workflow.addConditionalEdges("discovery", shouldContinue, {
    "discovery": "discovery",
    "pain_points": "pain_points",
});
workflow.addConditionalEdges("pain_points", shouldContinue, {
    "pain_points": "pain_points",
    "qualification": "qualification",
});
workflow.addConditionalEdges("qualification", shouldContinue, {
    "qualification": "qualification",
    "finish": "finish",
});
workflow.addEdge("finish", END);

// Compile the graph
export const app = workflow.compile();
