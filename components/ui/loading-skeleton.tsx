import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "avatar";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = "rectangular", 
  width, 
  height, 
  lines = 3 
}: SkeletonProps) {
  if (variant === "text") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-neutral-800 rounded animate-pulse"
            style={{ 
              width: typeof width === "number" ? `${width}px` : width || "100%",
              maxWidth: "100%"
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circular") {
    return (
      <div
        className={cn(
          "rounded-full bg-neutral-800 animate-pulse",
          className
        )}
        style={{
          width: width || "40px",
          height: height || "40px"
        }}
      />
    );
  }

  if (variant === "avatar") {
    return (
      <div
        className={cn(
          "rounded-full bg-neutral-800 animate-pulse flex items-center justify-center",
          className
        )}
        style={{
          width: width || "40px",
          height: height || "40px"
        }}
      >
        <div className="w-1/2 h-1/2 bg-neutral-700 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-neutral-800 rounded animate-pulse",
        className
      )}
      style={{
        width: width || "100%",
        height: height || "20px"
      }}
    />
  );
}