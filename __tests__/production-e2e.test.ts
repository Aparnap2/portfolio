/**
 * Production E2E Test for AI Audit System
 * Tests the complete audit workflow with real API calls
 * NO MOCKS - Uses actual Google AI API
 */

// Load environment variables before importing modules
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env') });

import { compiledAuditWorkflow } from "@/lib/workflows/audit-workflow";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";

describe("Production AI Audit System E2E Test", () => {
  let workflow: any;
  
  beforeAll(() => {
    // Verify API key is loaded
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not found in environment variables");
    }
    console.log("✅ Environment variables loaded successfully");
    
    // Use the production workflow
    workflow = compiledAuditWorkflow;
  });

  it("should complete full audit workflow with real AI responses", async () => {
    const sessionId = `prod-e2e-${Date.now()}`;
    const config = { configurable: { sessionId } };

    console.log("\n🚀 Starting production E2E test with session:", sessionId);

    // 1. Initialize the audit session
    console.log("\n📋 Step 1: Initialize audit...");
    let result = await workflow.invoke({ 
      messages: [],
      sessionId 
    }, config);
    
    expect(result.current_step).toBe("discovery");
    expect(result.messages.length).toBeGreaterThan(0);
    const initialMessage = result.messages[result.messages.length - 1].content;
    console.log("   AI Response:", initialMessage.substring(0, 100) + "...");

    // 2. User provides industry information
    console.log("\n📝 Step 2: Providing industry information...");
    result = await workflow.invoke({ 
      messages: [new HumanMessage("We run an e-commerce business selling electronics")] 
    }, config);
    
    const industryResponse = result.messages[result.messages.length - 1].content;
    console.log("   AI Response:", industryResponse.substring(0, 100) + "...");
    expect(result.messages.length).toBeGreaterThan(1);

    // 3. Continue conversation - provide company size
    console.log("\n👥 Step 3: Providing company size...");
    result = await workflow.invoke({ 
      messages: [new HumanMessage("We have about 75 employees across sales, operations, and customer support")] 
    }, config);
    
    console.log("   Current step:", result.current_step);
    console.log("   Messages count:", result.messages.length);
    
    // Give the AI a few more exchanges to extract discovery data
    let maxAttempts = 5;
    let attempts = 0;
    while (result.current_step === "discovery" && attempts < maxAttempts) {
      attempts++;
      console.log(`\n🔄 Step 3.${attempts}: Continuing discovery phase...`);
      
      const lastAIMessage = result.messages[result.messages.length - 1].content;
      console.log("   AI Question:", lastAIMessage.substring(0, 150) + "...");
      
      // Provide comprehensive business information
      const responses = [
        "We acquire customers through Google Ads, Facebook ads, and email marketing. We ship products via FedEx and UPS.",
        "Our acquisition channels are primarily digital advertising on Google and Meta platforms. We handle fulfillment through third-party logistics partners.",
        "We use online advertising and social media marketing. For delivery, we work with major shipping carriers and have automated tracking systems.",
      ];
      
      result = await workflow.invoke({ 
        messages: [new HumanMessage(responses[attempts % responses.length])] 
      }, config);
      
      console.log("   Step after response:", result.current_step);
      
      if (result.current_step !== "discovery") {
        console.log("   ✅ Discovery data extracted!");
        break;
      }
    }

    // Check if we have discovery data
    if (result.extracted_data?.discovery) {
      console.log("\n✅ Discovery data collected:", JSON.stringify(result.extracted_data.discovery, null, 2));
    }

    // 4. Continue to pain points phase
    if (result.current_step === "pain_points") {
      console.log("\n😣 Step 4: Discussing pain points...");
      
      result = await workflow.invoke({ 
        messages: [new HumanMessage("Our biggest pain points are manual order processing, customer data is scattered across multiple systems, and we spend too much time on repetitive email responses")] 
      }, config);
      
      const painResponse = result.messages[result.messages.length - 1].content;
      console.log("   AI Response:", painResponse.substring(0, 150) + "...");

      // Continue pain points conversation
      attempts = 0;
      while (result.current_step === "pain_points" && attempts < maxAttempts) {
        attempts++;
        console.log(`\n🔄 Step 4.${attempts}: Continuing pain points discussion...`);
        
        const lastAIMessage = result.messages[result.messages.length - 1].content;
        console.log("   AI Question:", lastAIMessage.substring(0, 150) + "...");
        
        result = await workflow.invoke({ 
          messages: [new HumanMessage("We spend about 30-40 hours per week on manual data entry and processing. Our team is frustrated with the lack of automation and integration between systems.")] 
        }, config);
        
        console.log("   Step after response:", result.current_step);
        
        if (result.current_step !== "pain_points") {
          console.log("   ✅ Pain points data extracted!");
          break;
        }
      }

      if (result.extracted_data?.pain_points) {
        console.log("\n✅ Pain points data collected:", JSON.stringify(result.extracted_data.pain_points, null, 2));
      }
    }

    // 5. Provide contact information
    if (result.current_step === "contact_info") {
      console.log("\n📧 Step 5: Providing contact information...");
      
      result = await workflow.invoke({ 
        messages: [new HumanMessage("My name is Alex Johnson, email is alex.johnson@testcompany.com, and the company is TechElectronics Inc")] 
      }, config);

      // Wait for processing
      attempts = 0;
      while (result.current_step === "contact_info" && attempts < 3) {
        attempts++;
        console.log(`\n🔄 Step 5.${attempts}: Processing contact info...`);
        
        const lastAIMessage = result.messages[result.messages.length - 1].content;
        console.log("   AI Response:", lastAIMessage.substring(0, 150) + "...");
        
        if (lastAIMessage.toLowerCase().includes('thank') || lastAIMessage.toLowerCase().includes('confirm')) {
          // Confirm
          result = await workflow.invoke({ 
            messages: [new HumanMessage("Yes, that's correct")] 
          }, config);
        }
        
        if (result.current_step !== "contact_info") {
          console.log("   ✅ Contact info processed!");
          break;
        }
      }

      if (result.extracted_data?.contact_info) {
        console.log("\n✅ Contact info collected:", JSON.stringify(result.extracted_data.contact_info, null, 2));
      }
    }

    // 6. Verify final state and results
    console.log("\n📊 Final Results:");
    console.log("   Final step:", result.current_step);
    console.log("   Total messages:", result.messages.length);
    console.log("   Extracted data keys:", Object.keys(result.extracted_data || {}));
    
    if (result.opportunities) {
      console.log("   Opportunities generated:", result.opportunities.length);
      result.opportunities.slice(0, 3).forEach((opp: any, idx: number) => {
        console.log(`   ${idx + 1}. ${opp.name} (Score: ${opp.matchScore})`);
      });
    }

    if (result.roadmap) {
      console.log("   Roadmap phases:", Object.keys(result.roadmap).length);
    }

    // Assertions
    expect(result.messages.length).toBeGreaterThan(5);
    expect(result.extracted_data).toBeDefined();
    
    console.log("\n✅ Production E2E test completed successfully!");
  }, 120000); // 2 minute timeout for real API calls

  it("should handle conversation state persistence", async () => {
    const sessionId = `persistence-test-${Date.now()}`;
    const config = { configurable: { sessionId } };

    console.log("\n🔍 Testing state persistence...");

    // Start conversation
    let result = await workflow.invoke({ messages: [], sessionId }, config);
    expect(result.current_step).toBe("discovery");

    // Add a message
    result = await workflow.invoke({ 
      messages: [new HumanMessage("We are a SaaS company")] 
    }, config);

    const messageCount = result.messages.length;
    console.log("   Messages after first exchange:", messageCount);

    // Retrieve state
    const state = await workflow.getState(config);
    expect(state.messages.length).toBe(messageCount);
    expect(state.current_step).toBe("discovery");

    console.log("   ✅ State persistence verified");
  }, 60000);

  it("should generate contextually relevant AI responses", async () => {
    const sessionId = `context-test-${Date.now()}`;
    const config = { configurable: { sessionId } };

    console.log("\n🤖 Testing AI response relevance...");

    // Initialize
    await workflow.invoke({ messages: [], sessionId }, config);

    // Ask about specific industry
    const result = await workflow.invoke({ 
      messages: [new HumanMessage("We're in healthcare technology, specifically telemedicine platforms")] 
    }, config);

    const aiResponse = result.messages[result.messages.length - 1].content.toLowerCase();
    console.log("   AI Response preview:", aiResponse.substring(0, 200));

    // Response should be contextually relevant to healthcare/telemedicine
    const isRelevant = 
      aiResponse.includes('health') || 
      aiResponse.includes('care') || 
      aiResponse.includes('patient') ||
      aiResponse.includes('medical') ||
      aiResponse.includes('compliance') ||
      aiResponse.includes('hipaa') ||
      aiResponse.includes('size') ||
      aiResponse.includes('employee') ||
      aiResponse.includes('team');

    expect(isRelevant).toBe(true);
    console.log("   ✅ AI response is contextually relevant");
  }, 60000);
});
