"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatHeader } from './ChatHeader';
import { ProgressBar } from './ProgressBar';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { EmailCaptureScreen } from './EmailCaptureScreen';
import { CompletionScreen } from './CompletionScreen';
import { useCurrentPhase } from '@/stores/audit-store';
import { useEmailCapture } from '@/hooks/useEmailCapture';

export function AuditChatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const currentPhase = useCurrentPhase();
  const { captured, setEmailValue } = useEmailCapture();

  // Determine which screen to show
  const showEmailCapture = !captured;
  const showChat = captured && currentPhase !== 'completed';
  const showCompletion = currentPhase === 'completed';

  const handleEmailCaptured = () => {
    // Email capture is handled by the hook
  };

  return (
    <ErrorBoundary>
      <div className="w-full max-w-5xl mx-auto h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)] min-h-[500px] max-h-[900px] px-2 sm:px-4">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              key={showEmailCapture ? 'email' : showCompletion ? 'completion' : 'chat'}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl"
            >
              {showEmailCapture && <EmailCaptureScreen onCapture={handleEmailCaptured} />}
              {showChat && (
                <>
                  <ChatHeader />
                  <ProgressBar />
                  <MessageList />
                  <ChatInput />
                </>
              )}
              {showCompletion && <CompletionScreen />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}