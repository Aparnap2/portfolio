/**
 * Simple Production E2E Test
 * Tests direct workflow invocation with real AI
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { HumanMessage } from "@langchain/core/messages";

describe("Simple Production E2E Test", () => {
  beforeAll(() => {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not found");
    }
    console.log("✅ API Key loaded");
  });

  it("should invoke workflow with real AI", async () => {
    // Import after env is loaded
    const { compiledAuditWorkflow } = await import("@/lib/workflows/audit-workflow");
    
    const sessionId = `test-${Date.now()}`;
    const config = { 
      configurable: { 
        thread_id: sessionId,
        sessionId 
      } 
    };
    
    const initialState = {
      messages: [],
      sessionId,
      current_step: "discovery" as const,
      extracted_data: {},
      opportunities: [],
      roadmap: null,
      painScore: 0
    };

    console.log("\n🚀 Invoking workflow...");
    const result = await compiledAuditWorkflow.invoke(initialState, config);
    
    console.log("✅ Workflow invoked successfully");
    console.log("   Current step:", result.current_step);
    console.log("   Messages:", result.messages.length);
    
    if (result.messages.length > 0) {
      const lastMessage = result.messages[result.messages.length - 1];
      console.log("   AI Response:", typeof lastMessage.content === 'string' 
        ? lastMessage.content.substring(0, 150) 
        : JSON.stringify(lastMessage.content).substring(0, 150));
    }

    expect(result.current_step).toBe("discovery");
    expect(result.messages.length).toBeGreaterThan(0);
  }, 60000);

  it("should handle user message", async () => {
    const { compiledAuditWorkflow } = await import("@/lib/workflows/audit-workflow");
    
    const sessionId = `test-msg-${Date.now()}`;
    const config = { 
      configurable: { 
        thread_id: sessionId,
        sessionId 
      } 
    };
    
    // First invoke to initialize
    const initialState = {
      messages: [],
      sessionId,
      current_step: "discovery" as const,
      extracted_data: {},
      opportunities: [],
      roadmap: null,
      painScore: 0
    };

    console.log("\n🚀 Step 1: Initialize...");
    let result = await compiledAuditWorkflow.invoke(initialState, config);
    console.log("   Messages after init:", result.messages.length);

    // User responds
    console.log("\n💬 Step 2: User responds...");
    const updatedState = {
      ...result,
      messages: [...result.messages, new HumanMessage("We are an e-commerce business selling consumer electronics")]
    };

    result = await compiledAuditWorkflow.invoke(updatedState, config);
    
    console.log("✅ Response received");
    console.log("   Total messages:", result.messages.length);
    console.log("   Current step:", result.current_step);
    
    if (result.messages.length > 0) {
      const lastMessage = result.messages[result.messages.length - 1];
      console.log("   AI Response:", typeof lastMessage.content === 'string'
        ? lastMessage.content.substring(0, 200)
        : JSON.stringify(lastMessage.content).substring(0, 200));
    }

    expect(result.messages.length).toBeGreaterThan(1);
  }, 60000);
});
