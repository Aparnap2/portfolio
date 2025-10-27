"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatHeader } from './ChatHeader';
import { ProgressBar } from './ProgressBar';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function AuditChatbot() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <ErrorBoundary>
      <div className="w-full max-w-5xl mx-auto h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)] min-h-[500px] max-h-[900px] px-2 sm:px-4">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl"
            >
              <ChatHeader />
              <ProgressBar />
              <MessageList />
              <ChatInput />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}