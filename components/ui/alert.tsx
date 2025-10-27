import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, XCircle, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alert variant
   */
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  
  /**
   * Whether to show the alert icon
   */
  showIcon?: boolean;
  
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
  
  /**
   * Alert title
   */
  title?: string;
  
  /**
   * Whether the alert can be dismissed
   */
  dismissible?: boolean;
  
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "default",
      showIcon = true,
      icon,
      title,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = "relative w-full rounded-lg border p-4";
    
    const variants = {
      default: "bg-background text-foreground border-border",
      destructive: "bg-destructive/10 text-destructive border-destructive/20",
      warning: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-800",
      success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
      info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800",
    };
    
    const iconVariants = {
      default: Info,
      destructive: XCircle,
      warning: AlertTriangle,
      success: CheckCircle,
      info: Info,
    };
    
    const IconComponent = iconVariants[variant];
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses, variants[variant], className)}
        role="alert"
        {...props}
      >
        <div className="flex">
          {showIcon && (
            <div className="flex-shrink-0">
              {icon || (
                <IconComponent
                  className={cn(
                    "h-5 w-5",
                    variant === "default" && "text-muted-foreground",
                    variant === "destructive" && "text-destructive",
                    variant === "warning" && "text-yellow-600 dark:text-yellow-400",
                    variant === "success" && "text-green-600 dark:text-green-400",
                    variant === "info" && "text-blue-600 dark:text-blue-400"
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          )}
          
          <div className={cn("ml-3", showIcon && "ml-3")}>
            {title && (
              <h3 className="text-sm font-medium mb-1">{title}</h3>
            )}
            <div className={cn("text-sm", title && "text-sm")}>
              {children}
            </div>
          </div>
          
          {dismissible && (
            <button
              onClick={onDismiss}
              className={cn(
                "ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                variant === "default" && "hover:bg-muted",
                variant === "destructive" && "hover:bg-destructive/20",
                variant === "warning" && "hover:bg-yellow-100 dark:hover:bg-yellow-800/30",
                variant === "success" && "hover:bg-green-100 dark:hover:bg-green-800/30",
                variant === "info" && "hover:bg-blue-100 dark:hover:bg-blue-800/30"
              )}
              aria-label="Dismiss"
            >
              <XCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

export { Alert };
