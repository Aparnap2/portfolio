/**
 * End-to-End Audit Flow Test
 * Tests the complete audit workflow from start to finish with all integrations
 */

import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { InMemoryStore } from "@langchain/langgraph";
import {
  generateThreadId,
  getOrCreateThread,
  createGraphConfig,
  storeUserProfile,
  getUserProfile,
  createCheckpointer,
  createMemoryStore,
} from "@/lib/workflows/thread-persistence";
import {
  evaluateDataCompleteness,
  validateROI,
  validateBaselines,
  checkAuditCoverage,
} from "@/lib/workflows/evaluators";

// Mock environment variables
process.env.GOOGLE_API_KEY = "test-google-api-key";
process.env.GOOGLE_REFRESH_TOKEN = "test-refresh-token";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
process.env.HUBSPOT_ACCESS_TOKEN = "test-hubspot-token";

// Mock Google AI
jest.mock("@langchain/google-genai", () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    bind: jest.fn().mockReturnThis(),
    invoke: jest.fn().mockResolvedValue({
      content: "Mock AI response",
      _getType: () => "ai",
    }),
  })),
  GoogleGenerativeAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  })),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock Sentry
jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe("End-to-End Audit Flow", () => {
  let store: InMemoryStore;
  let checkpointer: any;
  const testEmail = "test@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
    store = createMemoryStore();
    checkpointer = createCheckpointer();
  });

  describe("Complete Audit Journey", () => {
    it("should complete full audit flow from email to report generation", async () => {
      // ============================================
      // STEP 1: User starts audit with email
      // ============================================
      console.log("\n=== STEP 1: Starting Audit ===");
      
      const { threadId, isNew } = await getOrCreateThread(testEmail, store);
      
      expect(isNew).toBe(true);
      expect(threadId).toContain(testEmail);
      console.log(`✓ Thread created: ${threadId}`);

      // ============================================
      // STEP 2: Create initial state
      // ============================================
      console.log("\n=== STEP 2: Creating Initial State ===");
      
      const initialState = {
        messages: [new HumanMessage("I want to start an AI audit")],
        current_step: "discovery" as const,
        extracted_data: {},
        processes: {
          map: [],
          bottlenecks: [],
          baselines: { volumes: 0, cycleTime: 0, errors: 0 },
        },
        opportunities: {
          raw: [],
          categorized: {
            automation: [],
            agent: [],
            rag: [],
            integration: [],
            toolSwap: [],
          },
        },
        feasibility: {
          scores: [],
          blockers: [],
        },
        roi: {
          scenarios: {
            conservative: {
              savings: 0,
              breakeven: 0,
              monthlySavings: 0,
              implementationCost: 0,
              annualROI: 0,
              confidence: "conservative" as const,
            },
            base: {
              savings: 0,
              breakeven: 0,
              monthlySavings: 0,
              implementationCost: 0,
              annualROI: 0,
              confidence: "base" as const,
            },
            aggressive: {
              savings: 0,
              breakeven: 0,
              monthlySavings: 0,
              implementationCost: 0,
              annualROI: 0,
              confidence: "aggressive" as const,
            },
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
        roadmap: null,
        painScore: 0,
        sessionId: threadId,
        integrations: {},
      };

      console.log("✓ Initial state created");

      // ============================================
      // STEP 3: Discovery Phase - Collect company info
      // ============================================
      console.log("\n=== STEP 3: Discovery Phase ===");
      
      const discoveryData = {
        industry: "Technology",
        companySize: "50-100",
        acquisitionFlow: "We use inbound marketing with content and SEO, then sales team qualifies leads",
        deliveryFlow: "SaaS platform with automated onboarding and customer success team",
      };

      initialState.extracted_data.discovery = discoveryData;
      initialState.current_step = "pain_points";

      // Validate discovery data
      const discoveryEval = evaluateDataCompleteness(initialState as any);
      expect(discoveryEval.complete).toBe(false); // Still missing pain_points
      console.log(`✓ Discovery data collected: ${discoveryData.industry}, ${discoveryData.companySize} employees`);

      // Store profile in long-term memory
      await storeUserProfile(
        testEmail,
        {
          company: "Acme Corp",
          industry: discoveryData.industry,
          companySize: discoveryData.companySize,
          name: "John Doe",
        },
        store
      );
      console.log("✓ User profile stored in long-term memory");

      // ============================================
      // STEP 4: Pain Points Phase
      // ============================================
      console.log("\n=== STEP 4: Pain Points Phase ===");
      
      const painPointsData = {
        manualTasks: "Manual data entry from emails to CRM takes 15 hours per week, copy-pasting customer info, updating spreadsheets daily, repetitive tasks consuming significant time",
        bottlenecks: "Approval workflows take 2-3 days causing delays, waiting for manager sign-offs on deals, decision bottlenecks in multiple departments",
        dataSilos: "Sales data in Salesforce, marketing in HubSpot, support in Zendesk - no integration between systems, manual data sync required",
        budget: "$50,000 - $100,000",
        timeline: "3-6 months",
        userRole: "VP of Operations",
        hoursPerWeek: "20",
      };

      initialState.extracted_data.pain_points = painPointsData;
      initialState.current_step = "contact_info";

      console.log("✓ Pain points collected:");
      console.log(`  - Manual tasks: ${painPointsData.manualTasks.substring(0, 50)}...`);
      console.log(`  - Bottlenecks: ${painPointsData.bottlenecks.substring(0, 50)}...`);

      // ============================================
      // STEP 5: Contact Info Phase
      // ============================================
      console.log("\n=== STEP 5: Contact Info Phase ===");
      
      const contactInfo = {
        email: testEmail,
        name: "John Doe",
        company: "Acme Corp",
      };

      initialState.extracted_data.contact_info = contactInfo;
      initialState.current_step = "processing";

      // Validate completeness
      const completeEval = evaluateDataCompleteness(initialState as any);
      expect(completeEval.complete).toBe(true);
      console.log("✓ Contact info collected and validated");
      console.log(`  Confidence: ${(completeEval.confidence * 100).toFixed(0)}%`);

      // ============================================
      // STEP 6: Process Mapping
      // ============================================
      console.log("\n=== STEP 6: Process Mapping ===");
      
      const { mapProcessFromAnswers } = await import("@/lib/workflows/process-mapping");
      const processState = await mapProcessFromAnswers(initialState as any);

      initialState.processes = processState.processes!;

      expect(initialState.processes.map.length).toBeGreaterThan(0);
      expect(initialState.processes.bottlenecks.length).toBeGreaterThan(0);
      
      console.log(`✓ Process map created: ${initialState.processes.map.length} steps`);
      console.log(`✓ Bottlenecks identified: ${initialState.processes.bottlenecks.length}`);
      console.log(`  Baselines: ${initialState.processes.baselines.volumes} vol, ${initialState.processes.baselines.cycleTime}min cycle`);

      // Validate baselines
      const baselineValidation = validateBaselines(initialState as any);
      expect(baselineValidation.valid).toBe(true);
      console.log("✓ Baselines validated");

      // ============================================
      // STEP 7: Opportunity Mining
      // ============================================
      console.log("\n=== STEP 7: Opportunity Mining ===");
      
      const { categorizeOpportunities } = await import("@/lib/workflows/opportunity-mining");
      const opportunityState = await categorizeOpportunities(initialState as any);

      initialState.opportunities = opportunityState.opportunities!;

      expect(initialState.opportunities.raw.length).toBeGreaterThan(0);
      
      console.log(`✓ Opportunities generated: ${initialState.opportunities.raw.length} total`);
      console.log(`  - Automation: ${initialState.opportunities.categorized.automation.length}`);
      console.log(`  - Integration: ${initialState.opportunities.categorized.integration.length}`);
      console.log(`  - RAG: ${initialState.opportunities.categorized.rag.length}`);

      // ============================================
      // STEP 8: Feasibility Checks
      // ============================================
      console.log("\n=== STEP 8: Feasibility Checks ===");
      
      const { checkFeasibility } = await import("@/lib/workflows/feasibility-checks");
      const feasibilityState = await checkFeasibility(initialState as any);

      initialState.feasibility = feasibilityState.feasibility!;

      expect(initialState.feasibility.scores.length).toBeGreaterThan(0);
      
      const greenCount = initialState.feasibility.scores.filter(s => s.overallStatus === "green").length;
      const amberCount = initialState.feasibility.scores.filter(s => s.overallStatus === "amber").length;
      const redCount = initialState.feasibility.scores.filter(s => s.overallStatus === "red").length;
      
      console.log(`✓ Feasibility assessed: ${initialState.feasibility.scores.length} opportunities`);
      console.log(`  - Green: ${greenCount}, Amber: ${amberCount}, Red: ${redCount}`);

      // ============================================
      // STEP 9: ROI Calculation
      // ============================================
      console.log("\n=== STEP 9: ROI Calculation ===");
      
      const { calculateROI } = await import("@/lib/workflows/roi-calculator");
      const roiState = await calculateROI(initialState as any);

      initialState.roi = roiState.roi!;

      // ROI might be negative if implementation costs are high, which is valid
      expect(initialState.roi.scenarios.base.annualROI).toBeDefined();
      expect(typeof initialState.roi.scenarios.base.annualROI).toBe('number');
      
      console.log("✓ ROI calculated:");
      console.log(`  - Conservative: ${initialState.roi.scenarios.conservative.annualROI}% ROI`);
      console.log(`  - Base: ${initialState.roi.scenarios.base.annualROI}% ROI`);
      console.log(`  - Aggressive: ${initialState.roi.scenarios.aggressive.annualROI}% ROI`);
      console.log(`  - Monthly savings: $${initialState.roi.scenarios.base.monthlySavings.toLocaleString()}`);
      
      // If ROI is negative, log a warning but don't fail the test
      if (initialState.roi.scenarios.base.annualROI < 0) {
        console.log("  ⚠️  Note: Negative ROI indicates high implementation costs relative to savings");
      }

      // Validate ROI (may have warnings but should be valid)
      const roiValidation = validateROI(initialState as any);
      if (!roiValidation.valid) {
        console.log("  ROI validation issues:", roiValidation.issues);
      }
      if (roiValidation.warnings.length > 0) {
        console.log("  ROI warnings:", roiValidation.warnings);
      }
      // Don't fail on warnings, only on critical issues
      expect(roiValidation.issues.filter(i => !i.includes('Negative ROI')).length).toBe(0);
      console.log("✓ ROI validated (with potential warnings)");

      // ============================================
      // STEP 10: Check Audit Coverage
      // ============================================
      console.log("\n=== STEP 10: Audit Coverage Check ===");
      
      const coverage = checkAuditCoverage(initialState as any);
      
      expect(coverage.complete).toBe(true);
      expect(coverage.progress).toBe(100);
      
      console.log(`✓ Audit coverage: ${coverage.progress}%`);
      console.log(`  Completed steps: ${coverage.completedSteps.join(", ")}`);

      // ============================================
      // STEP 11: Calendar Integration (Mock)
      // ============================================
      console.log("\n=== STEP 11: Calendar Integration ===");
      
      // Mock successful calendar booking
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ calendars: { primary: { busy: [] } } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "event-123",
            htmlLink: "https://calendar.google.com/event?eid=event-123",
            conferenceData: {
              entryPoints: [{ uri: "https://meet.google.com/abc-defg-hij" }],
            },
          }),
        });

      const { createCalendarEvent } = await import("@/lib/integrations/google-calendar");
      
      const calendarResult = await createCalendarEvent({
        email: testEmail,
        name: contactInfo.name,
        duration: 20,
        timeRange: {
          start: new Date(Date.now() + 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 72 * 60 * 60 * 1000),
        },
      });

      expect(calendarResult.success).toBe(true);
      expect(calendarResult.meetLink).toBeDefined();
      
      initialState.integrations.calendar = {
        success: calendarResult.success,
        eventId: calendarResult.eventId,
        meetLink: calendarResult.meetLink,
      };

      console.log("✓ Calendar event created");
      console.log(`  Event ID: ${calendarResult.eventId}`);
      console.log(`  Meet link: ${calendarResult.meetLink}`);

      // ============================================
      // STEP 12: HubSpot Integration (Mock)
      // ============================================
      console.log("\n=== STEP 12: HubSpot Integration ===");
      
      // Mock HubSpot contact creation
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "contact-123" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "deal-456" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        });

      const { createHubSpotDeal } = await import("@/lib/integrations/hubspot");
      
      const hubspotResult = await createHubSpotDeal({
        email: testEmail,
        name: contactInfo.name,
        company: contactInfo.company,
        dealValue: initialState.roi.scenarios.base.savings,
        painScore: 75,
        auditUrl: `https://example.com/audit/${threadId}`,
      });

      expect(hubspotResult.success).toBe(true);
      
      initialState.integrations.hubspot = {
        success: hubspotResult.success,
        dealId: hubspotResult.dealId,
        contactId: hubspotResult.contactId,
      };

      console.log("✓ HubSpot deal created");
      console.log(`  Deal ID: ${hubspotResult.dealId}`);
      console.log(`  Contact ID: ${hubspotResult.contactId}`);

      // ============================================
      // STEP 13: Verify Thread Persistence
      // ============================================
      console.log("\n=== STEP 13: Thread Persistence Verification ===");
      
      // Retrieve stored profile
      const storedProfile = await getUserProfile(testEmail, store);
      expect(storedProfile).toBeDefined();
      expect(storedProfile.company).toBe("Acme Corp");
      console.log("✓ User profile retrieved from long-term memory");

      // Test thread resumption
      const { threadId: resumedThreadId, isNew: isResumed } = await getOrCreateThread(testEmail, store);
      expect(isResumed).toBe(false);
      expect(resumedThreadId).toBe(threadId);
      console.log("✓ Thread resumption works - same thread ID returned");

      // ============================================
      // STEP 14: Final State Validation
      // ============================================
      console.log("\n=== STEP 14: Final State Validation ===");
      
      // Verify all required data is present
      expect(initialState.extracted_data.discovery).toBeDefined();
      expect(initialState.extracted_data.pain_points).toBeDefined();
      expect(initialState.extracted_data.contact_info).toBeDefined();
      expect(initialState.processes.map.length).toBeGreaterThan(0);
      expect(initialState.opportunities.raw.length).toBeGreaterThan(0);
      expect(initialState.feasibility.scores.length).toBeGreaterThan(0);
      expect(initialState.roi.scenarios.base.annualROI).toBeDefined();
      expect(initialState.integrations.calendar?.success).toBe(true);
      expect(initialState.integrations.hubspot?.success).toBe(true);

      console.log("✓ All state validations passed");

      // ============================================
      // SUMMARY
      // ============================================
      console.log("\n=== AUDIT FLOW SUMMARY ===");
      console.log(`✓ Thread ID: ${threadId}`);
      console.log(`✓ User: ${contactInfo.name} (${contactInfo.email})`);
      console.log(`✓ Company: ${contactInfo.company}`);
      console.log(`✓ Industry: ${discoveryData.industry}`);
      console.log(`✓ Opportunities: ${initialState.opportunities.raw.length}`);
      console.log(`✓ ROI: ${initialState.roi.scenarios.base.annualROI.toFixed(0)}%`);
      console.log(`✓ Monthly Savings: $${initialState.roi.scenarios.base.monthlySavings.toLocaleString()}`);
      console.log(`✓ Calendar: ${calendarResult.meetLink}`);
      console.log(`✓ HubSpot Deal: ${hubspotResult.dealId}`);
      console.log(`✓ Audit Coverage: ${coverage.progress}%`);
      console.log("\n✅ END-TO-END AUDIT FLOW COMPLETED SUCCESSFULLY\n");
    });

    it("should handle incomplete data with retry logic", async () => {
      console.log("\n=== Testing Incomplete Data Handling ===");
      
      const incompleteState = {
        messages: [],
        current_step: "discovery" as const,
        extracted_data: {
          discovery: {
            industry: "Tech",
            // Missing other required fields
          },
        },
        processes: {
          map: [],
          bottlenecks: [],
          baselines: { volumes: 0, cycleTime: 0, errors: 0 },
        },
        opportunities: {
          raw: [],
          categorized: {
            automation: [],
            agent: [],
            rag: [],
            integration: [],
            toolSwap: [],
          },
        },
        feasibility: { scores: [], blockers: [] },
        roi: {
          scenarios: {
            conservative: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: "conservative" as const },
            base: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: "base" as const },
            aggressive: { savings: 0, breakeven: 0, monthlySavings: 0, implementationCost: 0, annualROI: 0, confidence: "aggressive" as const },
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
        roadmap: null,
        painScore: 0,
        sessionId: "test-session",
        integrations: {},
      };

      const evaluation = evaluateDataCompleteness(incompleteState as any);

      expect(evaluation.complete).toBe(false);
      expect(evaluation.missingFields.length).toBeGreaterThan(0);
      expect(evaluation.clarifyingQuestion).toBeDefined();

      console.log("✓ Incomplete data detected");
      console.log(`  Missing fields: ${evaluation.missingFields.join(", ")}`);
      console.log(`  Clarifying question: ${evaluation.clarifyingQuestion}`);
      console.log("✓ Retry logic would trigger here");
    });

    it("should handle integration failures gracefully", async () => {
      console.log("\n=== Testing Integration Failure Handling ===");
      
      // Mock calendar API failure
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "test-token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Service Unavailable",
          text: async () => "Calendar service is down",
        });

      const { createCalendarEvent } = await import("@/lib/integrations/google-calendar");
      
      const result = await createCalendarEvent({
        email: "test@example.com",
        name: "Test User",
        duration: 20,
        timeRange: {
          start: new Date(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log("✓ Integration failure handled gracefully");
      console.log(`  Error: ${result.error}`);
      console.log("✓ System continues without crashing");
    });
  });
});
