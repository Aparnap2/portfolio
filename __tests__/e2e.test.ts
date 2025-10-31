import { compiledAuditWorkflow } from "@/lib/workflows/audit-workflow";
import { HumanMessage } from "@langchain/core/messages";
import { StateGraph } from "@langchain/langgraph";
import { MemorySaver } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";

// Mock the LLM to have deterministic outputs for the test
jest.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    bind: jest.fn().mockReturnThis(),
    invoke: jest.fn((messages) => {
      const lastMessage = messages[messages.length - 1].content as string;

      if (typeof lastMessage === 'string' && lastMessage.includes('You are in the "discovery" step')) {
        return Promise.resolve(new AIMessage("Welcome! What industry are you in?"));
      }
      if (typeof lastMessage === 'string' && lastMessage.includes("e-commerce")) {
        return Promise.resolve(new AIMessage("Got it. And what is your company size?"));
      }
      if (typeof lastMessage === 'string' && lastMessage.includes("50 employees")) {
        return Promise.resolve(new AIMessage({
          content: "",
          tool_calls: [{
            name: "extract_data",
            args: { step: "discovery", data: { industry: "e-commerce", companySize: "50-100", acquisitionFlow: "Online ads", deliveryFlow: "Shipping" } }
          }]
        }));
      }
      if (typeof lastMessage === 'string' && lastMessage.includes('You are in the "pain_points" step')) {
        return Promise.resolve(new AIMessage("Let's discuss pain points."));
      }
      return Promise.resolve(new AIMessage("Default mock response."));
    }),
  })),
}));

describe("Conversational E2E Test with Memory", () => {
  it("should run through a multi-turn conversation, persisting state", async () => {
    // Use the compiled workflow with an in-memory checkpointer for the test
    const checkpointer = new MemorySaver();
    const conversationalWorkflow = compiledAuditWorkflow.withConfig({ configurable: { checkpointer } });

    const sessionId = "e2e-memory-test";
    const config = { configurable: { sessionId } };

    // 1. Start the conversation
    let result = await conversationalWorkflow.invoke({ messages: [] }, config);
    expect(result.messages[result.messages.length - 1].content).toContain("Welcome!");

    // 2. User provides the industry
    result = await conversationalWorkflow.invoke({ messages: [new HumanMessage("We are in e-commerce")] }, config);
    expect(result.messages[result.messages.length - 1].content).toContain("company size");

    // 3. User provides company size, which should trigger the tool call
    result = await conversationalWorkflow.invoke({ messages: [new HumanMessage("About 50 employees")] }, config);
    
    // The graph should have called the tool, processed it, and moved to the next step
    const finalState = await conversationalWorkflow.getState(config);
    expect(finalState.values.current_step).toBe("pain_points");
    expect(finalState.values.extracted_data.discovery?.industry).toBe("e-commerce");

    // 4. The next call should invoke the agent in the new 'pain_points' step
    result = await conversationalWorkflow.invoke({ messages: [] }, config);
    expect(result.messages[result.messages.length - 1].content).toContain("Let's discuss pain points");
  });
});