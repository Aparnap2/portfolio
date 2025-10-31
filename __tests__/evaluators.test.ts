/**
 * Evaluators Tests
 * TDD tests for data completeness and quality checks
 */

import {
  evaluateDataCompleteness,
  validateROI,
  validateBaselines,
  executeWithRetry,
  checkAuditCoverage,
} from "@/lib/workflows/evaluators";
import { AuditState } from "@/lib/workflows/audit-workflow";

describe("Data Completeness Evaluation", () => {
  describe("evaluateDataCompleteness", () => {
    it("should detect missing discovery data", () => {
      const state: Partial<AuditState> = {
        extracted_data: {},
        current_step: "discovery",
      };

      const evaluation = evaluateDataCompleteness(state as AuditState);

      expect(evaluation.complete).toBe(false);
      expect(evaluation.missingFields).toContain("discovery");
      expect(evaluation.clarifyingQuestion).toBeDefined();
      expect(evaluation.confidence).toBeLessThan(1.0);
    });

    it("should detect incomplete discovery data", () => {
      const state: Partial<AuditState> = {
        extracted_data: {
          discovery: {
            industry: "Tech",
            // Missing companySize, acquisitionFlow, deliveryFlow
          },
        },
        current_step: "discovery",
      };

      const evaluation = evaluateDataCompleteness(state as AuditState);

      expect(evaluation.complete).toBe(false);
      expect(evaluation.missingFields).toContain("discovery.companySize");
      expect(evaluation.confidence).toBeLessThan(1.0);
    });

    it("should pass complete discovery data", () => {
      const state: Partial<AuditState> = {
        extracted_data: {
          discovery: {
            industry: "Technology",
            companySize: "50-100",
            acquisitionFlow: "We use inbound marketing and sales outreach",
            deliveryFlow: "We deliver through a SaaS platform with onboarding",
          },
        },
        current_step: "discovery",
      };

      const evaluation = evaluateDataCompleteness(state as AuditState);

      expect(evaluation.complete).toBe(true);
      expect(evaluation.missingFields).toHaveLength(0);
      expect(evaluation.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it("should detect missing pain points data", () => {
      const state: Partial<AuditState> = {
        extracted_data: {
          discovery: {
            industry: "Tech",
            companySize: "50",
            acquisitionFlow: "Marketing",
            deliveryFlow: "SaaS",
          },
        },
        current_step: "pain_points",
      };

      const evaluation = evaluateDataCompleteness(state as AuditState);

      expect(evaluation.complete).toBe(false);
      expect(evaluation.missingFields).toContain("pain_points");
    });

    it("should detect invalid email", () => {
      const state: Partial<AuditState> = {
        extracted_data: {
          discovery: {
            industry: "Tech",
            companySize: "50",
            acquisitionFlow: "Marketing",
            deliveryFlow: "SaaS",
          },
          pain_points: {
            manualTasks: "Data entry",
            bottlenecks: "Approvals",
            budget: "$10k",
            timeline: "3 months",
          },
          contact_info: {
            email: "invalid-email",
            name: "John Doe",
          },
        },
        current_step: "contact_info",
      };

      const evaluation = evaluateDataCompleteness(state as AuditState);

      expect(evaluation.complete).toBe(false);
      expect(evaluation.missingFields).toContain("contact_info.email");
    });

    it("should pass complete contact info", () => {
      const state: Partial<AuditState> = {
        extracted_data: {
          discovery: {
            industry: "Tech",
            companySize: "50",
            acquisitionFlow: "Marketing",
            deliveryFlow: "SaaS",
          },
          pain_points: {
            manualTasks: "Data entry tasks",
            bottlenecks: "Approval workflows",
            budget: "$10k",
            timeline: "3 months",
          },
          contact_info: {
            email: "john@example.com",
            name: "John Doe",
          },
        },
        current_step: "contact_info",
      };

      const evaluation = evaluateDataCompleteness(state as AuditState);

      expect(evaluation.complete).toBe(true);
      expect(evaluation.missingFields).toHaveLength(0);
    });

    it("should generate appropriate clarifying questions", () => {
      const state: Partial<AuditState> = {
        extracted_data: {},
        current_step: "discovery",
      };

      const evaluation = evaluateDataCompleteness(state as AuditState);

      expect(evaluation.clarifyingQuestion).toBeDefined();
      expect(evaluation.clarifyingQuestion).toContain("industry");
    });
  });
});

describe("ROI Validation", () => {
  describe("validateROI", () => {
    it("should detect missing ROI scenarios", () => {
      const state: Partial<AuditState> = {
        roi: undefined,
        opportunities: { raw: [], categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] } },
      };

      const validation = validateROI(state as AuditState);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain("ROI scenarios not calculated");
    });

    it("should detect NaN values", () => {
      const state: Partial<AuditState> = {
        roi: {
          scenarios: {
            base: {
              annualROI: NaN,
              monthlySavings: 1000,
              savings: 12000,
              breakeven: 6,
              implementationCost: 10000,
              confidence: "base",
            },
            conservative: {} as any,
            aggressive: {} as any,
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
        opportunities: { raw: [{}], categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] } },
      };

      const validation = validateROI(state as AuditState);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain("Base ROI calculation resulted in NaN");
    });

    it("should warn about unrealistic ROI", () => {
      const state: Partial<AuditState> = {
        roi: {
          scenarios: {
            base: {
              annualROI: 1500,
              monthlySavings: 10000,
              savings: 120000,
              breakeven: 1,
              implementationCost: 5000,
              confidence: "base",
            },
            conservative: {
              annualROI: 1000,
              monthlySavings: 7000,
              savings: 84000,
              breakeven: 2,
              implementationCost: 5000,
              confidence: "conservative",
            },
            aggressive: {
              annualROI: 2000,
              monthlySavings: 13000,
              savings: 156000,
              breakeven: 1,
              implementationCost: 5000,
              confidence: "aggressive",
            },
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
        opportunities: { raw: [{}], categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] } },
      };

      const validation = validateROI(state as AuditState);

      expect(validation.warnings).toContain("ROI exceeds 1000% - may be unrealistic");
    });

    it("should detect scenario inconsistencies", () => {
      const state: Partial<AuditState> = {
        roi: {
          scenarios: {
            conservative: {
              annualROI: 200,
              monthlySavings: 5000,
              savings: 60000,
              breakeven: 3,
              implementationCost: 15000,
              confidence: "conservative",
            },
            base: {
              annualROI: 150,
              monthlySavings: 4000,
              savings: 48000,
              breakeven: 4,
              implementationCost: 15000,
              confidence: "base",
            },
            aggressive: {
              annualROI: 250,
              monthlySavings: 6000,
              savings: 72000,
              breakeven: 2,
              implementationCost: 15000,
              confidence: "aggressive",
            },
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
        opportunities: { raw: [{}], categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] } },
      };

      const validation = validateROI(state as AuditState);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain("Conservative ROI exceeds base ROI - calculation error");
    });

    it("should pass valid ROI", () => {
      const state: Partial<AuditState> = {
        roi: {
          scenarios: {
            conservative: {
              annualROI: 100,
              monthlySavings: 3000,
              savings: 36000,
              breakeven: 5,
              implementationCost: 15000,
              confidence: "conservative",
            },
            base: {
              annualROI: 150,
              monthlySavings: 4000,
              savings: 48000,
              breakeven: 4,
              implementationCost: 15000,
              confidence: "base",
            },
            aggressive: {
              annualROI: 200,
              monthlySavings: 5000,
              savings: 60000,
              breakeven: 3,
              implementationCost: 15000,
              confidence: "aggressive",
            },
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
        opportunities: { raw: [{}], categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] } },
      };

      const validation = validateROI(state as AuditState);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });
});

describe("Baseline Validation", () => {
  describe("validateBaselines", () => {
    it("should detect missing baselines", () => {
      const state: Partial<AuditState> = {
        processes: {
          map: [],
          bottlenecks: [],
          baselines: undefined as any,
        },
      };

      const validation = validateBaselines(state as AuditState);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain("Process baselines not calculated");
    });

    it("should detect invalid values", () => {
      const state: Partial<AuditState> = {
        processes: {
          map: [],
          bottlenecks: [],
          baselines: {
            volumes: 0,
            cycleTime: -5,
            errors: 1.5,
          },
        },
      };

      const validation = validateBaselines(state as AuditState);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    it("should warn about unrealistic values", () => {
      const state: Partial<AuditState> = {
        processes: {
          map: [],
          bottlenecks: [],
          baselines: {
            volumes: 150000,
            cycleTime: 600,
            errors: 0.6,
          },
        },
      };

      const validation = validateBaselines(state as AuditState);

      expect(validation.suggestions.length).toBeGreaterThan(0);
    });

    it("should pass valid baselines", () => {
      const state: Partial<AuditState> = {
        processes: {
          map: [],
          bottlenecks: [],
          baselines: {
            volumes: 1000,
            cycleTime: 30,
            errors: 0.05,
          },
        },
      };

      const validation = validateBaselines(state as AuditState);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });
});

describe("Retry Logic", () => {
  describe("executeWithRetry", () => {
    it("should succeed on first attempt", async () => {
      const mockFn = jest.fn().mockResolvedValue("success");
      const validator = jest.fn().mockReturnValue(true);

      const result = await executeWithRetry(
        mockFn,
        { maxRetries: 3, currentRetry: 0, backoffMs: 100 },
        validator
      );

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(validator).toHaveBeenCalledTimes(1);
    });

    it("should retry on validation failure", async () => {
      const mockFn = jest.fn()
        .mockResolvedValueOnce("invalid")
        .mockResolvedValueOnce("valid");
      const validator = jest.fn()
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const result = await executeWithRetry(
        mockFn,
        { maxRetries: 3, currentRetry: 0, backoffMs: 10 },
        validator
      );

      expect(result).toBe("valid");
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(validator).toHaveBeenCalledTimes(2);
    });

    it("should throw after max retries", async () => {
      const mockFn = jest.fn().mockResolvedValue("invalid");
      const validator = jest.fn().mockReturnValue(false);

      await expect(
        executeWithRetry(
          mockFn,
          { maxRetries: 2, currentRetry: 0, backoffMs: 10 },
          validator
        )
      ).rejects.toThrow("Max retries (2) exceeded");

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should handle function errors", async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce("success");
      const validator = jest.fn().mockReturnValue(true);

      const result = await executeWithRetry(
        mockFn,
        { maxRetries: 3, currentRetry: 0, backoffMs: 10 },
        validator
      );

      expect(result).toBe("success");
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

describe("Audit Coverage", () => {
  describe("checkAuditCoverage", () => {
    it("should detect incomplete audit", () => {
      const state: Partial<AuditState> = {
        extracted_data: {
          discovery: { industry: "Tech" },
        },
        processes: { map: [], bottlenecks: [], baselines: { volumes: 0, cycleTime: 0, errors: 0 } },
        opportunities: { raw: [], categorized: { automation: [], agent: [], rag: [], integration: [], toolSwap: [] } },
        feasibility: { scores: [], blockers: [] },
        roi: {
          scenarios: {
            base: { annualROI: 0, monthlySavings: 0, savings: 0, breakeven: 0, implementationCost: 0, confidence: "base" },
            conservative: { annualROI: 0, monthlySavings: 0, savings: 0, breakeven: 0, implementationCost: 0, confidence: "conservative" },
            aggressive: { annualROI: 0, monthlySavings: 0, savings: 0, breakeven: 0, implementationCost: 0, confidence: "aggressive" },
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
      };

      const coverage = checkAuditCoverage(state as AuditState);

      expect(coverage.complete).toBe(false);
      expect(coverage.completedSteps).toContain("discovery");
      expect(coverage.missingSteps.length).toBeGreaterThan(0);
      expect(coverage.progress).toBeLessThan(100);
    });

    it("should detect complete audit", () => {
      const state: Partial<AuditState> = {
        extracted_data: {
          discovery: { industry: "Tech", companySize: "50", acquisitionFlow: "Marketing", deliveryFlow: "SaaS" },
          pain_points: { manualTasks: "Data entry", bottlenecks: "Approvals", budget: "$10k", timeline: "3 months" },
          contact_info: { email: "test@example.com", name: "John Doe" },
        },
        processes: {
          map: [{ id: "1", name: "Process 1" }],
          bottlenecks: [{ id: "1", type: "approval", description: "Approval delay" }],
          baselines: { volumes: 100, cycleTime: 30, errors: 0.05 },
        },
        opportunities: {
          raw: [{ id: "1", name: "Opportunity 1" }],
          categorized: { automation: [{ id: "1", name: "Opportunity 1" }], agent: [], rag: [], integration: [], toolSwap: [] },
        },
        feasibility: {
          scores: [{ opportunityId: "1", technical: { score: 4 }, org: { score: 3 }, overallScore: 7, overallStatus: "green", blockers: [], recommendations: [] }],
          blockers: [],
        },
        roi: {
          scenarios: {
            base: { annualROI: 150, monthlySavings: 4000, savings: 48000, breakeven: 4, implementationCost: 15000, confidence: "base" },
            conservative: { annualROI: 100, monthlySavings: 3000, savings: 36000, breakeven: 5, implementationCost: 15000, confidence: "conservative" },
            aggressive: { annualROI: 200, monthlySavings: 5000, savings: 60000, breakeven: 3, implementationCost: 15000, confidence: "aggressive" },
          },
          roadmap: { quickWins: [], bigSwings: [], phases: [] },
        },
      };

      const coverage = checkAuditCoverage(state as AuditState);

      expect(coverage.complete).toBe(true);
      expect(coverage.missingSteps).toHaveLength(0);
      expect(coverage.progress).toBe(100);
    });
  });
});
