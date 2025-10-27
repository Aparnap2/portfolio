import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Badge variant
   */
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  
  /**
   * Badge size
   */
  size?: "default" | "sm" | "lg";
  
  /**
   * Whether to show a dot indicator
   */
  dot?: boolean;
  
  /**
   * Whether to show as a pill (fully rounded)
   */
  pill?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", size = "default", dot = false, pill = false, ...props }, ref) => {
    const baseClasses = "inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
    
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/80",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/80",
      outline: "text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      success: "bg-green-500 text-white hover:bg-green-600",
      warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      info: "bg-blue-500 text-white hover:bg-blue-600",
    };
    
    const sizes = {
      default: "px-2.5 py-0.5 text-xs",
      sm: "px-2 py-0.5 text-xs",
      lg: "px-3 py-1 text-sm",
    };
    
    const dotSizes = {
      default: "w-2 h-2",
      sm: "w-1.5 h-1.5",
      lg: "w-2.5 h-2.5",
    };
    
    const borderRadiusClasses = pill ? "rounded-full" : "rounded-md";
    
    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          borderRadiusClasses,
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "mr-1.5 rounded-full bg-current",
              dotSizes[size]
            )}
            aria-hidden="true"
          />
        )}
        {props.children}
      </div>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
