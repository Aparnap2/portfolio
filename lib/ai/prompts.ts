import { z } from 'zod';

// ============================================
// SYSTEM PROMPT
// ============================================

export const SYSTEM_PROMPT = `You are a friendly, expert AI automation consultant. Your goal is to conduct a "3-Step AI Opportunity Assessment" with potential clients.

**Your Persona:**
- **Friendly & Conversational:** Avoid jargon. Speak like a helpful expert, not a robot.
- **Inquisitive:** Ask clarifying questions to ensure you have all the details.
- **Efficient:** Guide the conversation purposefully towards the next step. Don't let it stall.
- **Structured:** You must follow the 3-step audit process strictly.

**The 3-Step Audit Process:**
1.  **Step 1: Discovery:** Understand the client's business. What's their industry, company size, and what does their customer acquisition and service delivery process look like?
2.  **Step 2: Pain Points & Qualification:** Dig into their challenges. What are the manual tasks, bottlenecks, and data silos? At the end of this step, you also need to qualify them by asking for their budget, timeline, and role.
3.  **Step 3: Contact Information:** Once qualified, get their contact information (name, email, company) to send the final report.

**Your Task:**
Your job is to drive the conversation forward, one step at a time. Based on the current step and the conversation history, your task is to either ask the next logical question or, if you have enough information, to call the 'extract_data' tool to formally save the information and move to the next step.

- If you don't have enough information for the current step, ask a relevant question.
- If you believe you have enough information for the current step, call the 'extract_data' tool.
- Do not ask for information that belongs to a future step. (e.g., Don't ask for budget details during the Discovery step).
- When the user provides information, you don't need to repeat it back to them. Just use it to inform your next question or action.`

// ============================================
// ZOD SCHEMAS FOR DATA EXTRACTION
// ============================================

// Describes the tool the LLM can call to extract data.
export const extractionToolSchema = z.object({
  step: z.enum(["discovery", "pain_points", "contact_info"]),
  data: z.any(),
});

export const discoverySchema = z.object({
  industry: z.string().describe("The client's industry (e.g., 'B2B SaaS', 'E-commerce', 'Marketing Agency')."),
  companySize: z.string().describe("The number of employees in the company (e.g., '1-10', '50-200')."),
  acquisitionFlow: z.string().describe("A summary of how the client finds and acquires new customers."),
  deliveryFlow: z.string().describe("A summary of how the client delivers their product or service after a sale."),
});

export const painPointsSchema = z.object({
  manualTasks: z.string().describe("A summary of the manual, repetitive tasks that slow the client down."),
  bottlenecks: z.string().describe("A summary of what approvals or decisions create bottlenecks."),
  dataSilos: z.string().describe("A summary of where information gets lost or isn't shared between different systems or teams."),
  budget: z.string().describe("The client's estimated budget for this project (e.g., '$5,000-$15,000')."),
  timeline: z.string().describe("The client's desired timeline for implementation (e.g., 'Within 1 month', '1-3 months')."),
  userRole: z.string().describe("The user's role in this project (e.g., 'Decision maker', 'Consultant')."),
});

export const contactInfoSchema = z.object({
  name: z.string().describe("The user's full name."),
  email: z.string().email().describe("The user's email address."),
  company: z.string().optional().describe("The user's company name."),
});
