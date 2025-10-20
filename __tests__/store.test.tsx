import { act } from 'react';
import { renderHook } from "@testing-library/react";
import { useAuditStore } from "@/stores/audit-store";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// Mock the API calls
global.fetch = jest.fn();

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  setContext: jest.fn(),
}));

describe("Conversational Audit Store", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    // Reset the store before each test
    act(() => {
      useAuditStore.getState().resetAudit();
    });
  });

  it("should initialize with the correct default state", () => {
    const { result } = renderHook(() => useAuditStore());
    
    expect(result.current.sessionId).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.currentPhase).toBe("discovery");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe("initializeSession", () => {
    it("should start a session and receive the first AI message", async () => {
      const mockApiResponse = {
        success: true,
        sessionId: "new-session-id",
        response: {
          messages: [new AIMessage("Welcome to the audit!")],
          current_step: "discovery",
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { result } = renderHook(() => useAuditStore());

      await act(async () => {
        await result.current.initializeSession();
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/audit/start", expect.any(Object));
      expect(result.current.sessionId).toBe("new-session-id");
      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].content).toBe("Welcome to the audit!");
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("submitMessage", () => {
    it("should send a user message and receive an AI response", async () => {
      const { result } = renderHook(() => useAuditStore());

      // 1. Set up an initial session state
      act(() => {
        useAuditStore.setState({
          sessionId: "existing-session",
          messages: [new AIMessage("What is your industry?")],
        });
      });

      const mockApiResponse = {
        success: true,
        response: {
          messages: [
            new AIMessage("What is your industry?"),
            new HumanMessage("e-commerce"),
            new AIMessage("Great! What is your company size?"),
          ],
          current_step: "discovery",
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      // 2. Submit the user's message
      await act(async () => {
        await result.current.submitMessage("e-commerce");
      });

      // 3. Verify the state was updated correctly
      expect(global.fetch).toHaveBeenCalledWith("/api/audit/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "existing-session",
          message: "e-commerce",
        }),
      });

      // Check optimistic update
      expect(result.current.messages[1].content).toBe("e-commerce");
      
      // Check final state from backend
      expect(result.current.messages.length).toBe(3);
      expect(result.current.messages[2].content).toContain("company size");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle reset correctly", () => {
    const { result } = renderHook(() => useAuditStore());

    act(() => {
        useAuditStore.setState({
          sessionId: "session-to-reset",
          messages: [new AIMessage("test"), new HumanMessage("test")],
          currentPhase: "pain_points",
          isLoading: true,
        });
      });

    act(() => {
        result.current.resetAudit();
    });

    expect(result.current.sessionId).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.currentPhase).toBe("discovery");
    expect(result.current.isLoading).toBe(false);
  });
});
