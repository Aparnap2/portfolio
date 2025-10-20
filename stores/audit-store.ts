"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import * as Sentry from "@sentry/nextjs";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

// ============================================
// TYPES
// ============================================

interface AuditState {
  sessionId: string | null;
  // The entire conversation history
  messages: BaseMessage[];
  // The current step of the audit, driven by the backend
  currentPhase: "discovery" | "pain_points" | "contact_info" | "processing" | "finished" | "completed";
  
  // UI State
  isLoading: boolean;
  error: string | null;
}

interface AuditActions {
  initializeSession: () => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  submitMessage: (message: string) => Promise<void>;
  resetAudit: () => void;
  setError: (error: string | null) => void;
}

type AuditStore = AuditState & AuditActions;

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAuditStore = create<AuditStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        sessionId: null,
        messages: [],
        currentPhase: "discovery" as const,
        isLoading: false,
        error: null,

        // ============================================
        // ACTIONS
        // ============================================

        initializeSession: async () => {
          try {
            set({ isLoading: true, error: null });

            const response = await fetch("/api/audit/start", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ipAddress: await getClientIP() }),
            });

            if (!response.ok) {
              throw new Error("Failed to initialize session");
            }

            const data = await response.json();
            const { sessionId, response: workflowResponse } = data;

            set({
              sessionId: sessionId,
              messages: workflowResponse.messages || [], // Set the initial AI message
              currentPhase: workflowResponse.current_step || "discovery",
              isLoading: false,
            });

            Sentry.setContext("audit", { sessionId });
            console.log("[AuditStore] Session initialized:", sessionId);

          } catch (error) {
            console.error("[AuditStore] Initialization failed:", error);
            Sentry.captureException(error);
            set({
              error: "Failed to start audit. Please refresh and try again.",
              isLoading: false,
            });
          }
        },

        // Add function to resume existing session
        resumeSession: async (sessionId: string) => {
          try {
            set({ isLoading: true, error: null });

            const response = await fetch(`/api/audit/session/${sessionId}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
              throw new Error("Failed to resume session");
            }

            const data = await response.json();
            
            set({
              sessionId: sessionId,
              messages: data.messages || [],
              currentPhase: data.current_step || "discovery",
              isLoading: false,
            });

            Sentry.setContext("audit", { sessionId });
            console.log("[AuditStore] Session resumed:", sessionId);

          } catch (error) {
            console.error("[AuditStore] Resume failed:", error);
            Sentry.captureException(error);
            set({
              error: "Failed to resume session. Starting new session...",
              isLoading: false,
            });
            // Fallback to creating new session
            await get().initializeSession();
          }
        },

        submitMessage: async (message: string) => {
          const { sessionId, messages } = get();
          console.log("[AuditStore] submitMessage called with:", { sessionId, messageLength: message?.length });
          
          if (!sessionId) {
            console.log("[AuditStore] No sessionId found, initializing...");
            // Try to initialize session if it doesn't exist
            await get().initializeSession();
            return;
          }

          try {
            // Add user message to state immediately for snappy UI
            const userMessage = new HumanMessage(message);
            set({
                messages: [...messages, userMessage],
                isLoading: true,
                error: null
            });

            console.log("[AuditStore] Sending request to API...");
            const response = await fetch("/api/audit/answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                message,
              }),
            });

            console.log("[AuditStore] Response status:", response.status);
            const responseData = await response.json();
            console.log("[AuditStore] Response data:", responseData);

            if (!response.ok) {
              throw new Error(responseData.error || "Failed to submit message");
            }

            const data = responseData;
            const { response: workflowResponse, current_step, completed } = data;

            // Update state with the new history from the backend
            set({
              messages: workflowResponse.messages || [],
              currentPhase: current_step || get().currentPhase,
              isLoading: false,
            });

            // If completed, update phase to finished
            if (completed) {
              set({ currentPhase: "finished" });
            }

          } catch (error) {
            console.error("[AuditStore] Submit message failed:", error);
            Sentry.captureException(error, { tags: { sessionId } });
            set({
              error: error instanceof Error ? error.message : "Failed to submit message",
              isLoading: false,
            });
          }
        },

        resetAudit: () => {
          set({
            sessionId: null,
            messages: [],
            currentPhase: "discovery" as const,
            isLoading: false,
            error: null,
          });
          // Keep persisted state for session ID, but clear messages
          // This allows resuming a session later if checkpoints are implemented
        },

        setError: (error: string | null) => {
          set({ error });
        },
      }),
      {
        name: "audit-storage", // name of the item in the storage (must be unique)
        partialize: (state) => ({
          sessionId: state.sessionId, // Only persist sessionId
        }),
      }
    ),
    { name: "AuditStore" }
  )
);

// ============================================
// HELPER FUNCTIONS (retained from original)
// ============================================

async function getClientIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return "unknown";
  }
}