import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export interface ValidationFeedbackProps {
  /**
   * Current field value
   */
  value: string;
  
  /**
   * Validation result
   */
  validation?: {
    valid: boolean;
    error?: string;
    warning?: string;
    sanitized?: any;
  };
  
  /**
   * Whether to show feedback immediately
   */
  immediate?: boolean;
  
  /**
   * Whether to show warnings
   */
  showWarnings?: boolean;
  
  /**
   * Custom success message
   */
  successMessage?: string;
  
  /**
   * Custom error message
   */
  errorMessage?: string;
  
  /**
   * Custom warning message
   */
  warningMessage?: string;
  
  /**
   * Whether to show character count
   */
  showCharCount?: boolean;
  
  /**
   * Maximum character count
   */
  maxChars?: number;
  
  /**
   * Whether to show strength indicator
   */
  showStrength?: boolean;
  
  /**
   * Custom strength calculation function
   */
  calculateStrength?: (value: string) => number;
  
  /**
   * Whether to animate transitions
   */
  animate?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Real-time validation feedback component with visual indicators
 */
export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  value,
  validation,
  immediate = false,
  showWarnings = true,
  successMessage,
  errorMessage,
  warningMessage,
  showCharCount = false,
  maxChars,
  showStrength = false,
  calculateStrength,
  animate = true,
  className
}) => {
  const [showFeedback, setShowFeedback] = useState(immediate);
  const [strength, setStrength] = useState(0);
  
  // Calculate password strength if needed
  useEffect(() => {
    if (showStrength && calculateStrength) {
      setStrength(calculateStrength(value));
    }
  }, [value, showStrength, calculateStrength]);
  
  // Show feedback after user stops typing
  useEffect(() => {
    if (!immediate) {
      const timer = setTimeout(() => setShowFeedback(true), 500);
      return () => clearTimeout(timer);
    }
  }, [value, immediate]);
  
  const isValid = validation?.valid;
  const hasError = validation?.error;
  const hasWarning = validation?.warning;
  
  // Calculate character count percentage
  const charCount = value.length;
  const charPercentage = maxChars ? (charCount / maxChars) * 100 : 0;
  
  // Get strength color
  const getStrengthColor = (strength: number) => {
    if (strength <= 20) return 'bg-red-500';
    if (strength <= 40) return 'bg-orange-500';
    if (strength <= 60) return 'bg-yellow-500';
    if (strength <= 80) return 'bg-blue-500';
    return 'bg-green-500';
  };
  
  // Get strength label
  const getStrengthLabel = (strength: number) => {
    if (strength <= 20) return 'Very Weak';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Fair';
    if (strength <= 80) return 'Good';
    return 'Strong';
  };
  
  if (!showFeedback && !immediate) return null;
  
  return (
    <div className={cn("space-y-2", className)}>
      {/* Validation Status */}
      {(isValid || hasError || hasWarning) && (
        <div className={cn(
          "flex items-center gap-2 text-sm",
          animate && "transition-all duration-200 ease-in-out"
        )}>
          {isValid && !hasError && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{successMessage || 'Valid'}</span>
            </div>
          )}
          
          {hasError && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMessage || validation.error}</span>
            </div>
          )}
          
          {hasWarning && showWarnings && (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{warningMessage || validation.warning}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Character Count */}
      {showCharCount && maxChars && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Characters: {charCount}/{maxChars}
          </div>
          <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 ease-out",
                charPercentage > 90 && "bg-red-500",
                charPercentage > 75 && "bg-yellow-500",
                charPercentage > 50 && "bg-blue-500",
                "bg-green-500"
              )}
              style={{ width: `${Math.min(charPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Strength Indicator */}
      {showStrength && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Password Strength</span>
            <span className={cn(
              "text-sm font-medium",
              strength <= 40 && "text-red-600",
              strength <= 60 && "text-orange-600",
              strength <= 80 && "text-yellow-600",
              "text-green-600"
            )}>
              {getStrengthLabel(strength)}
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all duration-300",
                  getStrengthColor(strength),
                  strength >= level * 20 ? "opacity-100" : "opacity-30"
                )}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Sanitized Value Display */}
      {validation?.sanitized !== undefined && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <span className="font-medium">Sanitized:</span> {JSON.stringify(validation.sanitized)}
        </div>
      )}
    </div>
  );
};

/**
 * Inline validation feedback for compact spaces
 */
export interface InlineValidationFeedbackProps {
  /**
   * Validation result
   */
  validation?: {
    valid: boolean;
    error?: string;
    warning?: string;
  };
  
  /**
   * Whether to show only the icon
   */
  iconOnly?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}

export const InlineValidationFeedback: React.FC<InlineValidationFeedbackProps> = ({
  validation,
  iconOnly = false,
  className
}) => {
  if (!validation) return null;
  
  const { valid, error, warning } = validation;
  
  if (valid && !warning) return null;
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {error && (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
      
      {warning && !error && (
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      )}
      
      {!iconOnly && (error || warning) && (
        <span className="text-sm text-muted-foreground">
          {error || warning}
        </span>
      )}
    </div>
  );
};

/**
 * Real-time validation hook for form fields
 */
export const useRealTimeValidation = (
  value: string,
  validator: (value: string) => { valid: boolean; error?: string; warning?: string },
  debounceMs = 300
) => {
  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
    warning?: string;
  }>({ valid: true });
  
  const [isValidating, setIsValidating] = useState(false);
  
  useEffect(() => {
    setIsValidating(true);
    
    const timer = setTimeout(() => {
      const result = validator(value);
      setValidation(result);
      setIsValidating(false);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [value, validator, debounceMs]);
  
  return {
    validation,
    isValidating,
    isValid: validation.valid,
    hasError: !!validation.error,
    hasWarning: !!validation.warning
  };
};

/**
 * Password strength calculator
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length bonus
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 25;
  
  // Character variety bonuses
  if (/[a-z]/.test(password)) strength += 10;
  if (/[A-Z]/.test(password)) strength += 10;
  if (/[0-9]/.test(password)) strength += 10;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
  
  return Math.min(strength, 100);
};

/**
 * Email strength calculator
 */
export const calculateEmailStrength = (email: string): number => {
  if (!email) return 0;
  
  let strength = 0;
  
  // Basic format check
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) strength += 40;
  
  // Domain quality
  const domain = email.split('@')[1];
  if (domain && domain.length > 5) strength += 20;
  if (domain && !domain.includes('temp')) strength += 20;
  if (domain && !domain.includes('test')) strength += 20;
  
  // Local part quality
  const localPart = email.split('@')[0];
  if (localPart && localPart.length > 3) strength += 10;
  if (localPart && /^[a-zA-Z0-9._-]+$/.test(localPart)) strength += 10;
  
  return Math.min(strength, 100);
};