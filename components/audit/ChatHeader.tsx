import React, { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentPhase, useIsLoading } from '@/stores/audit-store';

interface ChatHeaderProps {
  className?: string;
}

const getPhaseLabel = (phase: string) => {
  const labels = {
    discovery: "Discovery",
    pain_points: "Pain Points",
    qualification: "Qualification",
    email_request: "Contact Info",
    complete: "Complete",
    finished: "Finished",
    completed: "Completed"
  };
  return labels[phase as keyof typeof labels] || phase;
};

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

export const ChatHeader = memo<ChatHeaderProps>(({ className }) => {
  const currentPhase = useCurrentPhase();
  const isLoading = useIsLoading();

  return (
    <div className={cn("flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-neutral-800 flex-shrink-0", className)}>
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
  );
});

ChatHeader.displayName = 'ChatHeader';