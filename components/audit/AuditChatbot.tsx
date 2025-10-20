"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditStore } from "@/stores/audit-store";
import { cn } from "@/lib/utils";
import * as Sentry from "@sentry/nextjs";
import { MessageCircle, X, Send, Check, Bot, User, Sparkles } from "lucide-react";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export function AuditChatbot() {
  const [isOpen, setIsOpen] = useState(true); // Always open on audit page
  const [inputValue, setInputValue] = useState("");
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

  // Initialize session on mount since we're always open
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId, initializeSession]);

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
    <div className="fixed inset-0 sm:bottom-8 sm:right-8 sm:inset-auto z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col h-full w-full sm:h-[70vh] sm:max-h-[600px] sm:w-[400px] bg-neutral-950 border-neutral-800 sm:border sm:rounded-2xl overflow-hidden shadow-2xl sm:mb-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI Opportunity Assessment
                </h2>
                <p className="text-sm text-neutral-400">
                  {getPhaseLabel(currentPhase)} • {calculateProgress(currentPhase)}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 py-2 border-b border-neutral-800">
              <div className="w-full bg-neutral-800 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
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
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl transition-colors"
                  >
                    Close Chat
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  <AnimatePresence mode="popLayout">
                    {messages.map((message, index) => {
                      const role = message instanceof HumanMessage ? "user" : "assistant";
                      return (
                        <motion.div
                          key={index}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={cn("flex gap-3", role === "user" ? "justify-end" : "justify-start")}
                        >
                          {role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                              <Bot size={16} className="text-purple-400" />
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[80%] px-4 py-3 rounded-2xl",
                            role === "user" 
                              ? "bg-purple-600 text-white" 
                              : "bg-neutral-900 text-neutral-200 border border-neutral-800"
                          )}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content as string}
                            </p>
                          </div>
                          {role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0">
                              <User size={16} className="text-neutral-300" />
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
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot size={16} className="text-purple-400" />
                      </div>
                      <div className="bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-2xl">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-6 py-4 border-t border-neutral-800">
                  {error && (
                    <div className="mb-3 p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">
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
                      className="flex-1 px-4 py-3 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm border border-neutral-800 focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputValue.trim()}
                      className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Send size={20} />
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