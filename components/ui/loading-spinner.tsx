import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string; // For accessibility
  color?: "primary" | "secondary" | "white";
}

export function LoadingSpinner({ 
  size = "md", 
  className, 
  label = "Loading...",
  color = "primary" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const colorClasses = {
    primary: "border-purple-500 border-t-transparent",
    secondary: "border-neutral-500 border-t-transparent", 
    white: "border-white border-t-transparent"
  };

  return (
    <div 
      className={cn(
        "inline-block animate-spin rounded-full border-2",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface LoadingDotsProps {
  className?: string;
  label?: string;
}

export function LoadingDots({ className, label = "Loading" }: LoadingDotsProps) {
  return (
    <div 
      className={cn("flex space-x-1", className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface LoadingBarProps {
  progress?: number; // 0-100
  className?: string;
  label?: string;
  showPercentage?: boolean;
}

export function LoadingBar({ 
  progress = 0, 
  className, 
  label = "Loading progress",
  showPercentage = true 
}: LoadingBarProps) {
  return (
    <div 
      className={cn("w-full", className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="bg-neutral-800 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-purple-500 h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        >
          {showPercentage && (
            <span className="sr-only">{progress}% complete</span>
          )}
        </div>
      </div>
      {showPercentage && (
        <div className="text-xs text-neutral-500 mt-1 text-center">
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
}