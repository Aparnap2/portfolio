// Simple mock workflow for debugging - replacing complex LangGraph implementation
import { BaseMessage, AIMessage } from "@langchain/core/messages";

export interface AppState {
  messages: BaseMessage[];
  currentPhase: "discovery" | "pain_points" | "qualification" | "finish";
  discoveryData?: { industry: string; companySize: string; };
  painPointsData?: { manualTasks: string; bottlenecks: string; dataSilos: string; };
  qualificationData?: { budget: string; timeline: string; };
}

export const startNode = async (state: AppState) => {
  console.log("[MockWorkflow] Start node called");
  return {
    messages: [new AIMessage("Hi! I'm here to conduct a quick 3-step AI opportunity assessment for your business. Let's start with understanding your business. What industry are you in, and how many employees do you have?")],
  };
};

export const discoveryNode = async (state: AppState) => {
  console.log("[MockWorkflow] Discovery node called with state:", state);
  return {
    discoveryData: { industry: "Technology", companySize: "11-50" },
    messages: [new AIMessage("Thanks for sharing! Now, let's talk about your challenges. What are main pain points in your business? (e.g., manual tasks, bottlenecks, data silos)")],
  };
};

export const painPointsNode = async (state: AppState) => {
  console.log("[MockWorkflow] Pain points node called");
  return {
    painPointsData: {
      manualTasks: "Manual data entry",
      bottlenecks: "Slow processes",
      dataSilos: "Disconnected systems"
    },
    messages: [new AIMessage("Got it. Finally, let's talk about your budget and timeline for this project.")],
  };
};

export const qualificationNode = async (state: AppState) => {
  console.log("[MockWorkflow] Qualification node called");
  return {
    qualificationData: { budget: "$50,000", timeline: "3 months" },
    messages: [new AIMessage("Thanks! I have all the information I need. Let me prepare your assessment report.")],
  };
};

export const finishNode = async (state: AppState) => {
  console.log("[MockWorkflow] Finish node called");
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
  };
};

export const shouldContinue = (state: AppState) => {
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
};

// Simple mock app that doesn't use LangGraph
export const app = {
  invoke: async (state: AppState) => {
    console.log("[MockWorkflow] App invoked with state:", state);

    if (!state.messages || state.messages.length === 0) {
      console.log("[MockWorkflow] Starting with start node");
      return startNode(state);
    }

    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage && typeof lastMessage.content === 'string' && lastMessage.content.includes("industry")) {
      console.log("[MockWorkflow] Moving to discovery node");
      return discoveryNode(state);
    }

    if (lastMessage && typeof lastMessage.content === 'string' && lastMessage.content.includes("pain points")) {
      console.log("[MockWorkflow] Moving to pain points node");
      return painPointsNode(state);
    }

    if (lastMessage && typeof lastMessage.content === 'string' && lastMessage.content.includes("budget")) {
      console.log("[MockWorkflow] Moving to qualification node");
      return qualificationNode(state);
    }

    if (lastMessage && typeof lastMessage.content === 'string' && lastMessage.content.includes("summary")) {
      console.log("[MockWorkflow] Moving to finish node");
      return finishNode(state);
    }

    console.log("[MockWorkflow] Defaulting to discovery node");
    return discoveryNode(state);
  }
};
