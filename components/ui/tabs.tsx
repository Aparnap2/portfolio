import React, { createContext, useContext, forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
  orientation?: "horizontal" | "vertical";
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a TabsProvider");
  }
  return context;
};

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The value of the tab that should be active
   */
  value?: string;
  
  /**
   * The default value of the tab
   */
  defaultValue?: string;
  
  /**
   * Callback when the value changes
   */
  onValueChange?: (value: string) => void;
  
  /**
   * The orientation of the tabs
   */
  orientation?: "horizontal" | "vertical";
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, defaultValue, onValueChange, orientation = "horizontal", ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue || "");
    const currentValue = value !== undefined ? value : internalValue;
    
    const handleValueChange = (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };
    
    return (
      <TabsContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          orientation,
        }}
      >
        <div
          ref={ref}
          className={cn("w-full", className)}
          {...props}
        />
      </TabsContext.Provider>
    );
  }
);

Tabs.displayName = "Tabs";

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to loop through tabs when navigating with keyboard
   */
  loop?: boolean;
}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, loop = true, ...props }, ref) => {
    const { orientation } = useTabs();
    
    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
          orientation === "vertical" && "flex-col h-auto",
          className
        )}
        {...props}
      />
    );
  }
);

TabsList.displayName = "TabsList";

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The value of the tab
   */
  value: string;
  
  /**
   * Whether the tab is disabled
   */
  disabled?: boolean;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, disabled, ...props }, ref) => {
    const { value: currentValue, onValueChange } = useTabs();
    const isActive = currentValue === value;
    
    const handleClick = () => {
      if (!disabled) {
        onValueChange(value);
      }
    };
    
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        data-state={isActive ? "active" : "inactive"}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive && "bg-background text-foreground shadow-sm",
          !isActive && "hover:bg-background/50",
          className
        )}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The value of the tab content
   */
  value: string;
  
  /**
   * Whether to force the content to be mounted even when inactive
   */
  forceMount?: boolean;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, forceMount, children, ...props }, ref) => {
    const { value: currentValue } = useTabs();
    const isActive = currentValue === value;
    
    if (!forceMount && !isActive) {
      return null;
    }
    
    return (
      <div
        ref={ref}
        role="tabpanel"
        aria-labelledby={`tab-${value}`}
        data-state={isActive ? "active" : "inactive"}
        hidden={!isActive}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          !isActive && "hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
