import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant
   */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  
  /**
   * Button size
   */
  size?: "default" | "sm" | "lg" | "icon";
  
  /**
   * Whether to show loading state
   */
  loading?: boolean;
  
  /**
   * Loading text to show when loading
   */
  loadingText?: string;
  
  /**
   * Whether to show icon on the left
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Whether to show icon on the right
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Whether to add hover effects
   */
  withHover?: boolean;
  
  /**
   * Whether to add focus ring
   */
  withFocusRing?: boolean;
  
  /**
   * Whether to add transition effects
   */
  withTransition?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      withHover = true,
      withFocusRing = true,
      withTransition = true,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };
    
    const focusRingClasses = withFocusRing 
      ? "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
      : "";
    
    const transitionClasses = withTransition 
      ? "transition-colors duration-200 ease-in-out" 
      : "";
    
    const hoverClasses = withHover 
      ? variants[variant].split(" ").filter(cls => cls.startsWith("hover:")).join(" ")
      : "";
    
    const variantClasses = variants[variant].split(" ").filter(cls => !cls.startsWith("hover:")).join(" ");
    
    return (
      <button
        className={cn(
          baseClasses,
          variantClasses,
          hoverClasses,
          sizes[size],
          focusRingClasses,
          transitionClasses,
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            {loadingText || "Loading..."}
          </>
        )}
        
        {!loading && (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
