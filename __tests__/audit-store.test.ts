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

  it("should handle message submission success", async () => {
    const mockResponse = {
      messages: [
        { type: "human", content: "User message" },
        { type: "ai", content: "AI response" }
      ],
      currentPhase: "pain_points"
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
    expect(state.currentPhase).toBe("pain_points");
    expect(state.messages).toHaveLength(2);
  });

  it("should handle message submission failure", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

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
    expect(state.error).toBe("Network error");
  });

  it("should handle API error responses", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error"
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
    expect(state.error).toBe("Failed to get response from server");
  });

  it("should set loading state during message submission", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (fetch as jest.Mock).mockReturnValueOnce(promise);

    const { useAuditStore } = await import("@/stores/audit-store");

    // Set initial state
    useAuditStore.setState({
      sessionId: "test-session",
      messages: [],
      currentPhase: "discovery"
    });

    const { submitMessage } = useAuditStore.getState();

    // Start the submission
    const submissionPromise = submitMessage("Test message");

    // Check loading state is set
    let state = useAuditStore.getState();
    expect(state.isLoading).toBe(true);

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({
        messages: [{ type: "ai", content: "Response" }],
        currentPhase: "discovery"
      })
    });

    await submissionPromise;

    // Check loading state is cleared
    state = useAuditStore.getState();
    expect(state.isLoading).toBe(false);
  });

  it("should add user message to store immediately", async () => {
    const mockResponse = {
      messages: [
        { type: "human", content: "Test message" },
        { type: "ai", content: "AI response" }
      ],
      currentPhase: "discovery"
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const { useAuditStore } = await import("@/stores/audit-store");

    const { submitMessage } = useAuditStore.getState();
    await submitMessage("Test message");

    const state = useAuditStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].content).toBe("Test message");
    expect(state.messages[0]._getType()).toBe("human");
  });

  it("should reset audit state", async () => {
    const { useAuditStore } = await import("@/stores/audit-store");

    // Set some state
    useAuditStore.setState({
      sessionId: "test-session",
      messages: [{ content: "test", _getType: () => "human" } as any],
      currentPhase: "pain_points",
      error: "Some error",
      isLoading: true
    });

    const { resetAudit } = useAuditStore.getState();
    resetAudit();

    const state = useAuditStore.getState();
    expect(state.sessionId).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.currentPhase).toBe("discovery");
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("should set error state", async () => {
    const { useAuditStore } = await import("@/stores/audit-store");

    const { setError } = useAuditStore.getState();
    setError("Test error");

    const state = useAuditStore.getState();
    expect(state.error).toBe("Test error");
  });

  it("should clear error state", async () => {
    const { useAuditStore } = await import("@/stores/audit-store");

    // Set error first
    useAuditStore.setState({ error: "Test error" });

    const { setError } = useAuditStore.getState();
    setError(null);

    const state = useAuditStore.getState();
    expect(state.error).toBeNull();
  });
});