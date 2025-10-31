/**
 * Audit Workflow Unit Tests
 * Tests the core LangGraph workflow logic
 */

import { HumanMessage, AIMessage } from "@langchain/core/messages";

// Mock environment variables
process.env.GOOGLE_API_KEY = 'test-google-api-key';

// Mock Google AI before importing the workflow
jest.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    bind: jest.fn().mockImplementation((options) => ({
      invoke: jest.fn().mockImplementation(async (messages) => {
        const lastMessage = messages[messages.length - 1];
        
        // Always return a response with tool_calls for testing
        return {
          content: "",
          tool_calls: [{
            name: "extract_data",
            args: {
              step: "discovery",
              data: {
                industry: "test",
                companySize: "test"
              }
            }
          }],
          _getType: () => "ai",
          name: "mockAI"
        };
      })
    })),
  })),
  GoogleGenerativeAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  })),
}));

// Mock the processing functions
jest.mock("@/lib/workflows/audit-processing", () => ({
  matchOpportunities: jest.fn().mockImplementation(async (state) => ({
    ...state,
    opportunities: [{ name: "Test Opportunity", matchScore: 95 }]
  })),
  generateReport: jest.fn().mockImplementation(async (state) => ({
    ...state,
    roadmap: { phase1: "Test Phase" }
  })),
  sendNotifications: jest.fn().mockImplementation(async (state) => ({
    ...state,
    current_step: "finished" as const
  })),
}));

describe("Audit Workflow Tests", () => {
  let compiledAuditWorkflow: any;

  beforeAll(async () => {
    // Import after mocks are set up
    const { compiledAuditWorkflow: workflow } = await import("@/lib/workflows/audit-workflow");
    compiledAuditWorkflow = workflow;
  });

  it("should initialize with discovery step", async () => {
    const initialState = {
      messages: [],
      current_step: "discovery" as const,
      extracted_data: {},
      opportunities: [],
      roadmap: null,
      painScore: 0,
      sessionId: "test-session"
    };

    const result = await compiledAuditWorkflow.invoke(initialState);
    
    expect(result.current_step).toBe("discovery");
    expect(result.messages).toHaveLength(1);
    expect(result.sessionId).toBe("test-session");
  });

  it("should handle user messages", async () => {
    const stateWithMessage = {
      messages: [new HumanMessage("We are in e-commerce")],
      current_step: "discovery" as const,
      extracted_data: {},
      opportunities: [],
      roadmap: null,
      painScore: 0,
      sessionId: "test-session"
    };

    const result = await compiledAuditWorkflow.invoke(stateWithMessage);
    
    expect(result.messages.length).toBeGreaterThan(1);
    expect(result.messages[0]).toBeInstanceOf(HumanMessage);
  });

  it("should maintain session state", async () => {
    const sessionId = "persistent-session";
    const config = { configurable: { sessionId } };

    const initialState = {
      messages: [],
      sessionId,
      current_step: "discovery" as const,
      extracted_data: {},
      opportunities: [],
      roadmap: null,
      painScore: 0
    };

    const result = await compiledAuditWorkflow.invoke(initialState, config);
    expect(result.sessionId).toBe(sessionId);
  });
});