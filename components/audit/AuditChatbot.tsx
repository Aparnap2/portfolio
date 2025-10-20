"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditStore } from "@/stores/audit-store";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import { Send, Check, Bot, User, Sparkles } from "lucide-react";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Helper function to extract content from serialized LangChain messages
function getMessageContent(message: any): string {
  if (message.content) {
    // Direct content property
    return typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  }
  if (message.kwargs?.content) {
    // Serialized LangChain message has content in kwargs
    return typeof message.kwargs.content === 'string' ? message.kwargs.content : JSON.stringify(message.kwargs.content);
  }
  if (message.kwargs) {
    // Fallback to kwargs object
    return JSON.stringify(message.kwargs);
  }
  // Last resort
  return JSON.stringify(message);
}

export function AuditChatbot() {
  const [isOpen, setIsOpen] = useState(true); // Always open on audit page
  const [inputValue, setInputValue] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    sessionId,
    messages,
    currentPhase,
    initializeSession,
    resumeSession,
    submitMessage,
    isLoading,
    error,
  } = useAuditStore();

  // Initialize session on mount since we're always open, but only once
  useEffect(() => {
    if (!sessionId && !hasInitialized) {
      setHasInitialized(true);
      initializeSession();
    }
  }, [sessionId, initializeSession, hasInitialized]);

  // Check for persisted session on mount - but don't auto-resume to start fresh
  // Users can always continue if they want

  // Persist session ID when it changes
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('audit-session-id', sessionId);
    }
  }, [sessionId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();
    setInputValue("");

    try {
      await submitMessage(message);
    } catch (err) {
      console.error("Failed to submit message:", err);
      Sentry.captureException(err, {
        tags: { component: "AuditChatbot", phase: currentPhase },
        extra: { sessionId },
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const getPhaseLabel = (phase: string) => {
    const labels = {
      discovery: "Discovery",
      pain_points: "Pain Points",
      contact_info: "Contact Info",
      processing: "Processing",
      finished: "Finished",
      completed: "Completed"
    };
    return labels[phase as keyof typeof labels] || phase;
  };

  const calculateProgress = (phase: string) => {
    const progress = {
      discovery: 20,
      pain_points: 40,
      contact_info: 60,
      processing: 80,
      finished: 100,
      completed: 100
    };
    return progress[phase as keyof typeof progress] || 0;
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-8rem)] sm:h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)] min-h-[400px] max-h-[800px]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-neutral-800 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-white flex items-center gap-1 sm:gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                  <span className="truncate">AI Opportunity Assessment</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 truncate">
                  {getPhaseLabel(currentPhase)} • {calculateProgress(currentPhase)}%
                </p>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <div className={cn("w-2 h-2 rounded-full", isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-3 sm:px-4 lg:px-6 py-1 sm:py-2 border-b border-neutral-800">
              <div className="w-full bg-neutral-800 rounded-full h-1.5 sm:h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 sm:h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress(currentPhase)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Conditional content based on phase */}
            {currentPhase === "completed" || currentPhase === "finished" ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Assessment Complete!</h3>
                <p className="text-neutral-400 mb-6">
                  Your AI opportunity assessment has been completed. View your detailed report below.
                </p>
                <div className="space-y-3 w-full">
                  <a
                    href={`/audit/report/${sessionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-center"
                  >
                    View Full Report
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 space-y-2 sm:space-y-3 lg:space-y-4">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => {
                      const role = getMessageRole(message);
                      
                      // Helper function to determine message role
                      function getMessageRole(message: any): "user" | "assistant" {
                        // Check if message has the structure of a serialized HumanMessage
                        if (message.id && Array.isArray(message.id) && message.id[2] === 'HumanMessage') {
                          return "user";
                        }
                        // Check instance of (might not work with serialized objects)
                        if (message instanceof HumanMessage) {
                          return "user";
                        }
                        // Default to assistant
                        return "assistant";
                      }
                      return (
                        <motion.div
                          key={index}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn("flex gap-2 sm:gap-3", role === "user" ? "justify-end" : "justify-start")}
                        >
                          {role === "assistant" && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <Bot size={12} className="text-purple-400 sm:size-16" />
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[70%] sm:max-w-[80%] px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm",
                            role === "user" 
                              ? "bg-purple-600 text-white" 
                              : "bg-neutral-900 text-neutral-200 border border-neutral-800"
                          )}>
                            <p className="leading-relaxed whitespace-pre-wrap">
                              {getMessageContent(message)}
                            </p>
                          </div>
                          {role === "user" && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                              <User size={12} className="text-neutral-300 sm:size-16" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="flex gap-2 sm:gap-3 justify-start"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot size={12} className="text-purple-400 sm:size-16" />
                      </div>
                      <div className="bg-neutral-900 border border-neutral-800 px-2 sm:px-3 py-2 sm:py-3 rounded-lg sm:rounded-xl">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-t border-neutral-800">
                  {error && (
                    <div className="mb-2 p-2 bg-red-900/50 text-red-300 rounded-lg text-xs">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={
                        currentPhase === "discovery" ? "Tell me about your business..." :
                        currentPhase === "pain_points" ? "What challenges are you facing?" :
                        currentPhase === "contact_info" ? "What's your name and email?" :
                        "Type your answer..."
                      }
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 bg-neutral-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm border border-neutral-800 focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      
    </div>
  );
}