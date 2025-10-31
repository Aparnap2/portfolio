"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import * as Sentry from "@sentry/nextjs";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { shallow } from 'zustand/shallow';

// Helper to deserialize messages
const deserializeMessages = (messages: any[]): BaseMessage[] => {
  if (!messages || !Array.isArray(messages)) {
    return [];
  }
  return messages.map(msg => {
    if (msg.type === 'human') {
      return new HumanMessage({ content: msg.content });
    } else if (msg.type === 'ai') {
      return new AIMessage({ content: msg.content });
    }
    return new AIMessage({ content: msg.content });
  });
};

// ============================================
// TYPES
// ============================================

interface AuditState {
  messages: BaseMessage[];
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  currentPhase: "discovery" | "pain_points" | "qualification" | "finish";
}

interface AuditActions {
  submitMessage: (message: string) => Promise<void>;
  resetAudit: () => void;
  setError: (error: string | null) => void;
}

type AuditStore = AuditState & AuditActions;

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useAuditStore = create<AuditStore>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        // Initial state
        messages: [],
        sessionId: null,
        isLoading: false,
        error: null,
        currentPhase: "discovery" as const,

        // ============================================
        // ACTIONS
        // ============================================

        submitMessage: async (message: string) => {
          const { messages, currentPhase } = get();

          const userMessage = new HumanMessage(message);
          const newMessages = [...messages, userMessage];

          set({ messages: newMessages, isLoading: true, error: null });

          try {
            const response = await fetch("/api/audit/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: newMessages.map(m => ({ type: m._getType(), content: m.content })), currentPhase }),
            });

            if (!response.ok) {
              throw new Error("Failed to get response from server");
            }

            const data = await response.json();

            set({
              messages: deserializeMessages(data.messages),
              currentPhase: data.currentPhase,
              isLoading: false,
            });

          } catch (error) {
            console.error("[AuditStore] Submit message failed:", error);
            Sentry.captureException(error);
            set({
              error: error instanceof Error ? error.message : "Failed to submit message",
              isLoading: false,
            });
          }
        },

        resetAudit: () => {
          set({
            messages: [],
            sessionId: null,
            isLoading: false,
            error: null,
            currentPhase: "discovery" as const,
          });
        },

        setError: (error: string | null) => {
          set({ error });
        },
      }),
      { name: "AuditStore" }
    )
  )
);

// ============================================
// SELECTORS
// ============================================

export const useMessages = () => useAuditStore(state => state.messages);

export const useIsLoading = () => useAuditStore(state => state.isLoading);

export const useError = () => useAuditStore(state => state.error);

export const useCurrentPhase = () => useAuditStore(state => state.currentPhase);

export const useProgressPercentage = () => useAuditStore(state => {
    const phaseProgress = {
      discovery: 25,
      pain_points: 50,
      qualification: 75,
      finish: 100,
    };
    return phaseProgress[state.currentPhase as keyof typeof phaseProgress] || 0;
  });

export const useLastMessage = () => useAuditStore(state => state.messages[state.messages.length - 1] || null);

export const useMessageCount = () => useAuditStore(state => state.messages.length);

export const useCanSubmit = () => useAuditStore(state => !state.isLoading && !state.error);