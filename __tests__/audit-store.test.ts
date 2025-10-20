/**
 * Audit Store Tests
 * Tests the Zustand store functionality
 */

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  setContext: jest.fn(),
}));

describe("Audit Store Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it("should initialize with default state", async () => {
    // Dynamic import to avoid issues with mocking
    const { useAuditStore } = await import("@/stores/audit-store");
    
    const store = useAuditStore.getState();
    
    expect(store.sessionId).toBeNull();
    expect(store.messages).toEqual([]);
    expect(store.currentPhase).toBe("discovery");
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("should handle initialization success", async () => {
    const mockResponse = {
      success: true,
      sessionId: "test-session-123",
      response: {
        messages: [{ content: "Welcome!", getType: () => "ai" }],
        current_step: "discovery"
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { useAuditStore } = await import("@/stores/audit-store");
    const { initializeSession } = useAuditStore.getState();
    
    await initializeSession();
    
    const state = useAuditStore.getState();
    expect(state.sessionId).toBe("test-session-123");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should handle initialization failure", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { useAuditStore } = await import("@/stores/audit-store");
    const { initializeSession } = useAuditStore.getState();
    
    await initializeSession();
    
    const state = useAuditStore.getState();
    expect(state.sessionId).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toContain("Failed to start audit");
  });

  it("should handle message submission", async () => {
    const mockResponse = {
      success: true,
      response: {
        messages: [
          { content: "User message", getType: () => "human" },
          { content: "AI response", getType: () => "ai" }
        ],
        current_step: "discovery"
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { useAuditStore } = await import("@/stores/audit-store");
    
    // Set initial state
    useAuditStore.setState({
      sessionId: "test-session",
      messages: [],
      currentPhase: "discovery"
    });

    const { submitMessage } = useAuditStore.getState();
    await submitMessage("Test message");
    
    const state = useAuditStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should reset audit state", async () => {
    const { useAuditStore } = await import("@/stores/audit-store");
    
    // Set some state
    useAuditStore.setState({
      sessionId: "test-session",
      messages: [{ content: "test", getType: () => "human" }],
      currentPhase: "pain_points",
      error: "Some error"
    });

    const { resetAudit } = useAuditStore.getState();
    resetAudit();
    
    const state = useAuditStore.getState();
    expect(state.sessionId).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.currentPhase).toBe("discovery");
    expect(state.error).toBeNull();
  });
});