import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCurrentPhase } from '@/stores/audit-store';

interface ProgressBarProps {
  className?: string;
}

const calculateProgress = (phase: string) => {
  const progress = {
    discovery: 25,
    pain_points: 50,
    qualification: 75,
    email_request: 90,
    complete: 95,
    finished: 100,
    completed: 100
  };
  return progress[phase as keyof typeof progress] || 0;
};

export const ProgressBar = memo<ProgressBarProps>(({ className }) => {
  const currentPhase = useCurrentPhase();
  const progress = calculateProgress(currentPhase);

  return (
    <div className={cn("px-3 sm:px-4 lg:px-6 py-1 sm:py-2 border-b border-neutral-800", className)}>
      <div className="w-full bg-neutral-800 rounded-full h-1.5 sm:h-2">
        <motion.div
          className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 sm:h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';