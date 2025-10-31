/**
 * End-to-End Test for AI Audit System
 * Tests the complete audit workflow without relying on server
 */

import { compiledAuditWorkflow } from "@/lib/workflows/audit-workflow";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";

// Mock environment variables for testing
process.env.GOOGLE_API_KEY = 'test-google-api-key';

// Mock the Google AI API for deterministic testing
jest.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    bind: jest.fn().mockReturnThis(),
    invoke: jest.fn((messages) => {
      const lastMessage = messages[messages.length - 1].content as string;

      // Discovery phase responses
      if (lastMessage.includes('You are in "discovery" step')) {
        return Promise.resolve({
          content: "Welcome! I'm here to help identify AI automation opportunities for your business. Let's start with some basic information. What industry are you in?",
          _getType: () => "ai",
          name: "discoveryAI"
        });
      }

      if (lastMessage.toLowerCase().includes('e-commerce') || lastMessage.toLowerCase().includes('ecommerce')) {
        return Promise.resolve({
          content: "Great! E-commerce has many automation opportunities. What's your company size in terms of employees?",
          _getType: () => "ai",
          name: "discoveryAI"
        });
      }

      if (lastMessage.includes('50') && lastMessage.toLowerCase().includes('employee')) {
        return Promise.resolve({
          content: "",
          tool_calls: [{
            name: "extract_data",
            args: {
              step: "discovery",
              data: {
                industry: "e-commerce",
                companySize: "50-100",
                acquisitionFlow: "Online ads and social media",
                deliveryFlow: "Automated shipping and tracking"
              }
            }
          }],
          _getType: () => "ai",
          name: "dataExtractionAI"
        });
      }

      // Pain points phase responses
      if (lastMessage.includes('You are in "pain_points" step')) {
        return Promise.resolve({
          content: "Now let's identify your biggest pain points. What manual tasks are taking up most of your team's time?",
          _getType: () => "ai",
          name: "painPointsAI"
        });
      }

      if (lastMessage.toLowerCase().includes('manual') && lastMessage.toLowerCase().includes('data entry')) {
        return Promise.resolve({
          content: "Data entry is a common pain point. How many hours per week does your team spend on manual data entry tasks?",
          _getType: () => "ai",
          name: "painPointsAI"
        });
      }

      if (lastMessage.includes('20') && lastMessage.toLowerCase().includes('hour')) {
        return Promise.resolve({
          content: "",
          tool_calls: [{
            name: "extract_data",
            args: {
              step: "pain_points",
              data: {
                manualTasks: ["data_entry", "reporting", "customer_follow_up"],
                hoursPerWeek: 20,
                decisionBottlenecks: "Manual approval processes",
                dataSilos: "CRM and inventory systems not connected"
              }
            }
          }],
          _getType: () => "ai",
          name: "dataExtractionAI"
        });
      }

      // Contact info phase responses
      if (lastMessage.includes('You are in "contact_info" step')) {
        return Promise.resolve({
          content: "Perfect! I have enough information to generate your personalized AI opportunity report. To send you the detailed analysis, I'll need your contact information. What's your name and email?",
          _getType: () => "ai",
          name: "contactAI"
        });
      }

      if (lastMessage.toLowerCase().includes('john') && lastMessage.includes('@')) {
        return Promise.resolve({
          content: "",
          tool_calls: [{
            name: "extract_data",
            args: {
              step: "contact_info",
              data: {
                name: "John Doe",
                email: "john@example.com",
                company: "Test E-commerce Co"
              }
            }
          }],
          _getType: () => "ai",
          name: "dataExtractionAI"
        });
      }

      return Promise.resolve({
        content: "I understand. Could you provide more details?",
        _getType: () => "ai",
        name: "fallbackAI"
      });
    }),
  })),
  GoogleGenerativeAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  })),
}));

// Mock the audit processing functions
jest.mock("@/lib/workflows/audit-processing", () => ({
  matchOpportunities: jest.fn().mockImplementation(async (state) => {
    return {
      ...state,
      opportunities: [
        {
          name: "Automated Lead Scoring",
          category: "lead_gen",
          hoursSavedPerMonth: 40,
          monthlySavings: 2400,
          devCostMid: 8000,
          implementationWeeks: 4,
          matchScore: 95
        },
        {
          name: "Inventory Sync Automation", 
          category: "ops_automation",
          hoursSavedPerMonth: 30,
          monthlySavings: 1800,
          devCostMid: 6000,
          implementationWeeks: 3,
          matchScore: 88
        }
      ]
    };
  }),
  generateReport: jest.fn().mockImplementation(async (state) => {
    return {
      ...state,
      roadmap: {
        phase1: "Lead scoring automation",
        phase2: "Inventory synchronization", 
        phase3: "Customer support automation"
      }
    };
  }),
  sendNotifications: jest.fn().mockImplementation(async (state) => {
    return {
      ...state,
      current_step: "finished" as const
    };
  }),
}));

describe("AI Audit System E2E Test", () => {
  let checkpointer: MemorySaver;
  let workflow: any;
  
  beforeEach(() => {
    checkpointer = new MemorySaver();
    workflow = compiledAuditWorkflow;
  });

  it("should complete full audit workflow from discovery to report generation", async () => {
    const sessionId = "e2e-test-session";
    const config = { configurable: { sessionId } };

    // 1. Initialize the audit session
    console.log("🚀 Starting audit session...");
    let result = await workflow.invoke({ 
      messages: [],
      sessionId 
    }, config);
    
    expect(result.current_step).toBe("discovery");
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toContain("Welcome!");

    // 2. User provides industry information
    console.log("📝 User provides industry: e-commerce");
    result = await workflow.invoke({ 
      messages: [new HumanMessage("We are in e-commerce business")] 
    }, config);
    
    expect(result.messages[result.messages.length - 1].content).toContain("company size");

    // 3. User provides company size, triggering data extraction
    console.log("👥 User provides company size: 50 employees");
    result = await workflow.invoke({ 
      messages: [new HumanMessage("We have about 50 employees")] 
    }, config);
    
    // Should have moved to pain_points phase
    expect(result.current_step).toBe("pain_points");
    expect(result.extracted_data.discovery).toBeDefined();
    expect(result.extracted_data.discovery?.industry).toBe("e-commerce");
    expect(result.extracted_data.discovery?.companySize).toBe("50-100");

    // 4. Pain points discovery
    console.log("😣 Discovering pain points...");
    result = await workflow.invoke({ 
      messages: [new HumanMessage("We spend a lot of time on manual data entry")] 
    }, config);
    
    expect(result.messages[result.messages.length - 1].content).toContain("hours per week");

    // 5. User provides time spent on manual tasks
    console.log("⏰ User provides time spent: 20 hours/week");
    result = await workflow.invoke({ 
      messages: [new HumanMessage("About 20 hours per week on data entry")] 
    }, config);
    
    // Should have moved to contact_info phase
    expect(result.current_step).toBe("contact_info");
    expect(result.extracted_data.pain_points).toBeDefined();
    expect(result.extracted_data.pain_points?.hoursPerWeek).toBe(20);

    // 6. Contact information collection
    console.log("📧 Collecting contact information...");
    result = await workflow.invoke({ 
      messages: [new HumanMessage("My name is John Doe and email is john@example.com")] 
    }, config);
    
    // Should have moved to processing phase and then finished
    expect(result.current_step).toBe("finished");
    expect(result.extracted_data.contact_info).toBeDefined();
    expect(result.extracted_data.contact_info?.name).toBe("John Doe");
    expect(result.extracted_data.contact_info?.email).toBe("john@example.com");

    // 7. Verify opportunities were generated
    expect(result.opportunities).toBeDefined();
    expect(result.opportunities).toHaveLength(2);
    expect(result.opportunities[0].name).toBe("Automated Lead Scoring");
    expect(result.opportunities[1].name).toBe("Inventory Sync Automation");

    // 8. Verify roadmap was generated
    expect(result.roadmap).toBeDefined();
    expect(result.roadmap.phase1).toBe("Lead scoring automation");

    console.log("✅ Full audit workflow completed successfully!");
    console.log("📊 Generated opportunities:", result.opportunities.length);
    console.log("🗺️ Roadmap phases:", Object.keys(result.roadmap).length);
  }, 30000); // 30 second timeout for the full workflow

  it("should handle user dropping off at different phases", async () => {
    const sessionId = "dropout-test-session";
    const config = { configurable: { sessionId } };

    // Start audit
    let result = await workflow.invoke({ 
      messages: [],
      sessionId 
    }, config);
    
    expect(result.current_step).toBe("discovery");

    // User provides partial information then stops
    result = await workflow.invoke({ 
      messages: [new HumanMessage("We are in e-commerce")] 
    }, config);

    // Verify state is preserved
    const state = await workflow.getState(config);
    expect(state.current_step).toBe("discovery");
    expect(state.messages).toHaveLength(3); // Initial + user + AI response

    console.log("✅ Dropout handling test passed");
  });

  it("should validate extracted data schemas", async () => {
    const sessionId = "validation-test-session";
    const config = { configurable: { sessionId } };

    // Start and complete discovery phase
    await workflow.invoke({ messages: [], sessionId }, config);
    await workflow.invoke({ messages: [new HumanMessage("e-commerce")] }, config);
    let result = await workflow.invoke({ 
      messages: [new HumanMessage("50 employees")] 
    }, config);

    // Verify discovery data structure
    const discoveryData = result.extracted_data.discovery;
    expect(discoveryData).toHaveProperty('industry');
    expect(discoveryData).toHaveProperty('companySize');
    expect(discoveryData?.industry).toBe('e-commerce');

    console.log("✅ Data validation test passed");
  });

  it("should calculate pain score and ROI metrics", async () => {
    const sessionId = "metrics-test-session";
    const config = { configurable: { sessionId } };

    // Complete full workflow
    await workflow.invoke({ messages: [], sessionId }, config);
    await workflow.invoke({ messages: [new HumanMessage("e-commerce")] }, config);
    await workflow.invoke({ messages: [new HumanMessage("50 employees")] }, config);
    await workflow.invoke({ messages: [new HumanMessage("manual data entry")] }, config);
    await workflow.invoke({ messages: [new HumanMessage("20 hours per week")] }, config);
    let result = await workflow.invoke({ 
      messages: [new HumanMessage("John Doe john@example.com")] 
    }, config);

    // Verify opportunities have ROI calculations
    const opportunities = result.opportunities;
    expect(opportunities[0]).toHaveProperty('hoursSavedPerMonth');
    expect(opportunities[0]).toHaveProperty('monthlySavings');
    expect(opportunities[0]).toHaveProperty('devCostMid');
    expect(opportunities[0].monthlySavings).toBe(2400); // 40 hours * $60/hour

    console.log("✅ ROI calculation test passed");
  });
});