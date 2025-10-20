import { NextRequest } from "next/server";
import { AIMessage } from "@langchain/core/messages";

// Mock redis
jest.mock("@/lib/redis", () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

// Mock the workflow
jest.mock("@/lib/workflows/audit-workflow", () => ({
  compiledAuditWorkflow: {
    invoke: jest.fn(),
  },
}));

// Mock the Upstash Redis chat history
jest.mock("@langchain/community/stores/message/upstash_redis", () => ({
  UpstashRedisChatMessageHistory: jest.fn().mockImplementation(() => ({
    getMessages: jest.fn().mockResolvedValue([]),
    addMessages: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe("API Route Functions - Conversational", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/audit/start", () => {
    it("should initialize a conversation and return the first message", async () => {
      const { POST: startAudit } = await import("@/app/api/audit/start/route");

      const mockWorkflowResponse = {
        messages: [new AIMessage("Welcome!")],
        current_step: "discovery",
      };
      (require("@/lib/workflows/audit-workflow").compiledAuditWorkflow.invoke as jest.Mock).mockResolvedValue(mockWorkflowResponse);

      const mockRequest = {
        json: async () => ({ ipAddress: "127.0.0.1" }),
      } as NextRequest;

      const response = await startAudit(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(data.response.messages[0].content).toBe("Welcome!");
    });
  });

  describe("POST /api/audit/answer", () => {
    it("should process a user message and return an AI response", async () => {
      const { POST: submitAnswer } = await import("@/app/api/audit/answer/route");

      const mockWorkflowResponse = {
        messages: [new AIMessage("What is your industry?"), new AIMessage("Thanks! What is your company size?")],
        current_step: "discovery",
      };
      (require("@/lib/workflows/audit-workflow").compiledAuditWorkflow.invoke as jest.Mock).mockResolvedValue(mockWorkflowResponse);

      const mockRequest = {
        json: async () => ({
          sessionId: "test-session-123",
          message: "I work in e-commerce",
        }),
      } as NextRequest;

      const response = await submitAnswer(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.response.messages.length).toBe(2);
      expect(data.response.messages[1].content).toContain("company size");
    });

    it("should return an error if sessionId or message are missing", async () => {
        const { POST: submitAnswer } = await import("@/app/api/audit/answer/route");
  
        const mockRequest = {
          json: async () => ({ sessionId: "test-session-123" }), // Missing message
        } as NextRequest;
  
        const response = await submitAnswer(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Missing required fields");
      });
  });
});
