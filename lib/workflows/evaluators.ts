/**
 * Evaluators for Data Completeness and Quality Checks
 * Implements retry logic and clarifying question generation
 */

import { AuditState } from "./audit-workflow";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = process.env.GOOGLE_API_KEY
  ? new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro",
      temperature: 0.3,
      apiKey: process.env.GOOGLE_API_KEY,
    })
  : null;

// ============================================
// DATA COMPLETENESS EVALUATION
// ============================================

export interface CompletenessEvaluation {
  complete: boolean;
  missingFields: string[];
  clarifyingQuestion?: string;
  confidence: number; // 0-1 scale
}

/**
 * Evaluate if extracted data is complete and valid
 */
export function evaluateDataCompleteness(state: AuditState): CompletenessEvaluation {
  const { extracted_data, current_step } = state;
  const missingFields: string[] = [];
  let confidence = 1.0;

  // Check discovery data
  if (current_step === "discovery" || current_step === "pain_points" || current_step === "contact_info") {
    if (!extracted_data.discovery) {
      missingFields.push("discovery");
      confidence -= 0.3;
    } else {
      if (!extracted_data.discovery.industry || extracted_data.discovery.industry.length < 3) {
        missingFields.push("discovery.industry");
        confidence -= 0.1;
      }
      if (!extracted_data.discovery.companySize) {
        missingFields.push("discovery.companySize");
        confidence -= 0.1;
      }
      if (!extracted_data.discovery.acquisitionFlow || extracted_data.discovery.acquisitionFlow.length < 10) {
        missingFields.push("discovery.acquisitionFlow");
        confidence -= 0.1;
      }
      if (!extracted_data.discovery.deliveryFlow || extracted_data.discovery.deliveryFlow.length < 10) {
        missingFields.push("discovery.deliveryFlow");
        confidence -= 0.1;
      }
    }
  }

  // Check pain points data
  if (current_step === "pain_points" || current_step === "contact_info") {
    if (!extracted_data.pain_points) {
      missingFields.push("pain_points");
      confidence -= 0.3;
    } else {
      if (!extracted_data.pain_points.manualTasks || extracted_data.pain_points.manualTasks.length < 10) {
        missingFields.push("pain_points.manualTasks");
        confidence -= 0.1;
      }
      if (!extracted_data.pain_points.bottlenecks || extracted_data.pain_points.bottlenecks.length < 10) {
        missingFields.push("pain_points.bottlenecks");
        confidence -= 0.1;
      }
      if (!extracted_data.pain_points.budget) {
        missingFields.push("pain_points.budget");
        confidence -= 0.05;
      }
      if (!extracted_data.pain_points.timeline) {
        missingFields.push("pain_points.timeline");
        confidence -= 0.05;
      }
    }
  }

  // Check contact info
  if (current_step === "contact_info") {
    if (!extracted_data.contact_info) {
      missingFields.push("contact_info");
      confidence -= 0.3;
    } else {
      if (!extracted_data.contact_info.email || !isValidEmail(extracted_data.contact_info.email)) {
        missingFields.push("contact_info.email");
        confidence -= 0.2;
      }
      if (!extracted_data.contact_info.name || extracted_data.contact_info.name.length < 2) {
        missingFields.push("contact_info.name");
        confidence -= 0.1;
      }
    }
  }

  const complete = missingFields.length === 0 && confidence >= 0.7;
  const clarifyingQuestion = complete ? undefined : generateClarifyingQuestion(missingFields, extracted_data);

  return {
    complete,
    missingFields,
    clarifyingQuestion,
    confidence: Math.max(0, confidence),
  };
}

/**
 * Generate clarifying question for missing or incomplete data
 */
function generateClarifyingQuestion(missingFields: string[], extracted_data: any): string {
  // Prioritize most important missing fields
  if (missingFields.includes("contact_info.email")) {
    return "To send you the audit report, I'll need your email address. What's the best email to reach you?";
  }

  if (missingFields.includes("contact_info.name")) {
    return "I'd like to personalize your report. What's your name?";
  }

  if (missingFields.includes("discovery.industry")) {
    return "To provide relevant recommendations, could you tell me what industry you're in?";
  }

  if (missingFields.includes("discovery.companySize")) {
    return "How many people work at your company? This helps me estimate the impact of automation opportunities.";
  }

  if (missingFields.includes("pain_points.manualTasks")) {
    return "Could you describe some of the manual, repetitive tasks your team handles regularly?";
  }

  if (missingFields.includes("pain_points.bottlenecks")) {
    return "What are the biggest bottlenecks or delays in your current processes?";
  }

  if (missingFields.includes("pain_points.budget")) {
    return "Do you have a budget range in mind for automation initiatives?";
  }

  if (missingFields.includes("pain_points.timeline")) {
    return "What's your ideal timeline for implementing automation solutions?";
  }

  // Generic fallback
  return "Could you provide a bit more detail about your current situation? This will help me create a more accurate assessment.";
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ============================================
// ROI VALIDATION
// ============================================

export interface ROIValidation {
  valid: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Validate ROI calculations for sanity
 */
export function validateROI(state: AuditState): ROIValidation {
  const { roi, opportunities } = state;
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!roi || !roi.scenarios) {
    issues.push("ROI scenarios not calculated");
    return { valid: false, issues, warnings };
  }

  // Check for NaN values
  if (isNaN(roi.scenarios.base.annualROI)) {
    issues.push("Base ROI calculation resulted in NaN");
  }

  if (isNaN(roi.scenarios.base.monthlySavings)) {
    issues.push("Monthly savings calculation resulted in NaN");
  }

  // Check for unrealistic values
  if (roi.scenarios.base.annualROI > 1000) {
    warnings.push("ROI exceeds 1000% - may be unrealistic");
  }

  if (roi.scenarios.base.annualROI < 0) {
    warnings.push("Negative ROI - implementation cost exceeds savings");
  }

  // Check scenario consistency
  if (roi.scenarios.conservative.annualROI > roi.scenarios.base.annualROI) {
    issues.push("Conservative ROI exceeds base ROI - calculation error");
  }

  if (roi.scenarios.base.annualROI > roi.scenarios.aggressive.annualROI) {
    issues.push("Base ROI exceeds aggressive ROI - calculation error");
  }

  // Check opportunities alignment
  if (opportunities.raw.length === 0) {
    issues.push("No opportunities identified for ROI calculation");
  }

  const valid = issues.length === 0;
  return { valid, issues, warnings };
}

// ============================================
// BASELINE VALIDATION
// ============================================

export interface BaselineValidation {
  valid: boolean;
  issues: string[];
  suggestions: string[];
}

/**
 * Validate process baselines for reasonableness
 */
export function validateBaselines(state: AuditState): BaselineValidation {
  const { processes } = state;
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!processes || !processes.baselines) {
    issues.push("Process baselines not calculated");
    return { valid: false, issues, suggestions };
  }

  const { volumes, cycleTime, errors } = processes.baselines;

  // Check for zero or negative values
  if (volumes <= 0) {
    issues.push("Volume baseline is zero or negative");
  }

  if (cycleTime <= 0) {
    issues.push("Cycle time baseline is zero or negative");
  }

  if (errors < 0 || errors > 1) {
    issues.push("Error rate must be between 0 and 1");
  }

  // Check for unrealistic values
  if (volumes > 100000) {
    suggestions.push("Volume exceeds 100k/month - verify this is accurate");
  }

  if (cycleTime > 480) {
    suggestions.push("Cycle time exceeds 8 hours - verify this is accurate");
  }

  if (errors > 0.5) {
    suggestions.push("Error rate exceeds 50% - this seems very high");
  }

  const valid = issues.length === 0;
  return { valid, issues, suggestions };
}

// ============================================
// RETRY LOGIC
// ============================================

export interface RetryConfig {
  maxRetries: number;
  currentRetry: number;
  backoffMs: number;
}

/**
 * Execute function with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  validator: (result: T) => boolean
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn();

      if (validator(result)) {
        return result;
      }

      console.log(`[Retry] Validation failed on attempt ${attempt + 1}`);
    } catch (error) {
      lastError = error as Error;
      console.error(`[Retry] Error on attempt ${attempt + 1}:`, error);
    }

    // Wait before retry (exponential backoff)
    if (attempt < config.maxRetries) {
      const waitTime = config.backoffMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(
    `Max retries (${config.maxRetries}) exceeded. Last error: ${lastError?.message || "Unknown"}`
  );
}

/**
 * Retry extraction with LLM
 */
export async function retryExtraction(
  state: AuditState,
  step: string,
  maxRetries: number = 3
): Promise<any> {
  if (!llm) {
    throw new Error("LLM not configured");
  }

  const config: RetryConfig = {
    maxRetries,
    currentRetry: 0,
    backoffMs: 1000,
  };

  return executeWithRetry(
    async () => {
      // Generate clarifying prompt
      const evaluation = evaluateDataCompleteness(state);
      const prompt = evaluation.clarifyingQuestion || "Please provide more details.";

      // Call LLM with clarifying question
      const response = await llm.invoke([
        { role: "system", content: "You are extracting structured data from user responses." },
        { role: "user", content: prompt },
      ]);

      return response;
    },
    config,
    (result) => {
      // Validate result has content
      return result && typeof result.content === "string" && result.content.length > 0;
    }
  );
}

// ============================================
// COVERAGE CHECKS
// ============================================

/**
 * Check if all required audit steps have been covered
 */
export function checkAuditCoverage(state: AuditState): {
  complete: boolean;
  completedSteps: string[];
  missingSteps: string[];
  progress: number;
} {
  const requiredSteps = [
    "discovery",
    "pain_points",
    "contact_info",
    "process_mapping",
    "opportunity_mining",
    "feasibility_check",
    "roi_calculation",
  ];

  const completedSteps: string[] = [];

  if (state.extracted_data.discovery) completedSteps.push("discovery");
  if (state.extracted_data.pain_points) completedSteps.push("pain_points");
  if (state.extracted_data.contact_info) completedSteps.push("contact_info");
  if (state.processes.map.length > 0) completedSteps.push("process_mapping");
  if (state.opportunities.raw.length > 0) completedSteps.push("opportunity_mining");
  if (state.feasibility.scores.length > 0) completedSteps.push("feasibility_check");
  if (state.roi.scenarios.base.annualROI !== 0) completedSteps.push("roi_calculation");

  const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));
  const progress = (completedSteps.length / requiredSteps.length) * 100;

  return {
    complete: missingSteps.length === 0,
    completedSteps,
    missingSteps,
    progress: Math.round(progress),
  };
}
