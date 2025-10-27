"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { z } from 'zod';
import { validateField } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './loading-spinner';

export interface FormProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onChange'> {
  /**
   * Unique identifier for the form
   */
  formId?: string;
  
  /**
   * Initial form values
   */
  initialValues?: Record<string, any>;
  
  /**
   * Validation schema for the form
   */
  validation?: Record<string, z.ZodSchema<any>>;
  
  /**
   * Whether to show validation errors
   */
  showErrors?: boolean;
  
  /**
   * Form submission handler
   */
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
  
  /**
   * Form change handler
   */
  onChange?: (values: Record<string, any>, field: string, value: any) => void;
  
  /**
   * Form validation change handler
   */
  onValidationChange?: (errors: Record<string, string>) => void;
  
  /**
   * Success message to show on successful submission
   */
  successMessage?: string;
  
  /**
   * Whether to reset form after successful submission
   */
  resetOnSuccess?: boolean;
  
  /**
   * Debounce time for validation (ms)
   */
  validationDebounce?: number;
  
  /**
   * Whether to validate on change
   */
  validateOnChange?: boolean;
  
  /**
   * Whether to validate on blur
   */
  validateOnBlur?: boolean;
}

export interface FormRef {
  /**
   * Get current form values
   */
  getValues: () => Record<string, any>;
  
  /**
   * Set form values
   */
  setValues: (values: Record<string, any>) => void;
  
  /**
   * Get current validation errors
   */
  getErrors: () => Record<string, string>;
  
  /**
   * Validate the entire form
   */
  validate: () => Promise<boolean>;
  
  /**
   * Validate a specific field
   */
  validateField: (field: string) => Promise<string | null>;
  
  /**
   * Reset the form
   */
  reset: () => void;
  
  /**
   * Focus on a specific field
   */
  focusField: (field: string) => void;
  
  /**
   * Submit the form
   */
  submit: () => Promise<void>;
}

const FormContext = React.createContext<{
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  onFieldChange: (field: string, value: any) => void;
  onFieldBlur: (field: string) => void;
  registerField: (field: string, element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => void;
  showErrors: boolean;
} | null>(null);

export const useFormContext = () => {
  const context = React.useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
};

/**
 * Reusable Form Component with built-in validation, loading states, and error handling
 */
export const Form = forwardRef<FormRef, FormProps>(({
  formId,
  initialValues = {},
  validation = {},
  showErrors = true,
  onSubmit,
  onChange,
  onValidationChange,
  successMessage,
  resetOnSuccess = false,
  validationDebounce = 300,
  validateOnChange = true,
  validateOnBlur = true,
  className,
  children,
  ...props
}, ref) => {
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>>({});
  
  // Form state
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  // Validation timeouts
  const validationTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Validate a single field
  const validateFieldAsync = useCallback(async (field: string, value: any): Promise<string | null> => {
    const schema = validation[field];
    if (!schema) return null;
    
    try {
      schema.parse(value);
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid input';
      }
      return 'Validation failed';
    }
  }, [validation]);
  
  // Validate entire form
  const validateFormAsync = useCallback(async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    let formIsValid = true;
    
    for (const [field, schema] of Object.entries(validation)) {
      const error = await validateFieldAsync(field, values[field]);
      if (error) {
        newErrors[field] = error;
        formIsValid = false;
      }
    }
    
    setErrors(newErrors);
    setIsValid(formIsValid);
    onValidationChange?.(newErrors);
    
    return formIsValid;
  }, [validation, values, validateFieldAsync, onValidationChange]);
  
  // Handle field value change
  const handleFieldChange = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    onChange?.(values, field, value);
    
    // Clear existing timeout
    if (validationTimeouts.current[field]) {
      clearTimeout(validationTimeouts.current[field]);
    }
    
    // Validate with debounce
    if (validateOnChange && validation[field]) {
      validationTimeouts.current[field] = setTimeout(async () => {
        const error = await validateFieldAsync(field, value);
        setErrors(prev => {
          const newErrors = { ...prev };
          if (error) {
            newErrors[field] = error;
          } else {
            delete newErrors[field];
          }
          return newErrors;
        });
      }, validationDebounce);
    }
  }, [values, onChange, validateOnChange, validation, validationDebounce, validateFieldAsync]);
  
  // Handle field blur
  const handleFieldBlur = useCallback(async (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (validateOnBlur && validation[field]) {
      const error = await validateFieldAsync(field, values[field]);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    }
  }, [validateOnBlur, validation, values, validateFieldAsync]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate all fields
      const formIsValid = await validateFormAsync();
      
      if (!formIsValid) {
        setIsSubmitting(false);
        return;
      }
      
      // Submit form
      await onSubmit?.(values);
      
      if (resetOnSuccess) {
        setValues(initialValues);
        setErrors({});
        setTouched({});
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateFormAsync, onSubmit, values, resetOnSuccess, initialValues]);
  
  // Register field ref
  const registerField = useCallback((field: string, element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    fieldRefs.current[field] = element;
  }, []);
  
  // Expose form methods via ref
  useImperativeHandle(ref, () => ({
    getValues: () => values,
    setValues: (newValues) => {
      setValues(newValues);
    },
    getErrors: () => errors,
    validate: validateFormAsync,
    validateField: (field: string) => validateFieldAsync(field, values[field]),
    reset: () => {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    },
    focusField: (field) => {
      fieldRefs.current[field]?.focus();
    },
    submit: async () => {
      await handleSubmit(new Event('submit') as any);
    }
  }), [values, errors, validateFormAsync, validateFieldAsync, initialValues, handleSubmit]);
  
  const contextValue = {
    values,
    errors,
    touched,
    isSubmitting,
    onFieldChange: handleFieldChange,
    onFieldBlur: handleFieldBlur,
    registerField,
    showErrors,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        ref={formRef}
        id={formId}
        className={cn("space-y-4", className)}
        onSubmit={handleSubmit}
        noValidate
        {...props}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
});

Form.displayName = 'Form';

/**
 * Form Field Component for individual form inputs
 */
export interface FormFieldProps {
  /**
   * Field name
   */
  name: string;
  
  /**
   * Field label
   */
  label?: string;
  
  /**
   * Field description
   */
  description?: string;
  
  /**
   * Whether to show the field
   */
  show?: boolean;
  
  /**
   * Custom field component
   */
  children: React.ReactNode;
}

export const FormFieldComponent: React.FC<FormFieldProps> = ({
  name,
  label,
  description,
  show = true,
  children
}) => {
  if (!show) return null;
  
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      {children}
      
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
};

/**
 * Form Input Component with built-in validation
 */
export interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'form'> {
  /**
   * Field name
   */
  name: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  name,
  className,
  value,
  onChange,
  onBlur,
  ...props
}, ref) => {
  const {
    values: formValues,
    errors: formErrors,
    touched: formTouched,
    isSubmitting,
    onFieldChange,
    onFieldBlur,
    registerField,
    showErrors,
  } = useFormContext();

  const fieldValue = formValues[name] ?? value ?? '';
  const fieldError = formErrors[name];
  const fieldTouched = formTouched[name];
  const hasError = fieldTouched && fieldError && showErrors;
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Merge refs
  const mergedRef = useCallback((element: HTMLInputElement) => {
    inputRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    registerField?.(name, element);
  }, [ref, registerField, name]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onFieldChange?.(name, e.target.value);
  }, [onChange, onFieldChange, name]);
  
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
    onFieldBlur?.(name);
  }, [onBlur, onFieldBlur, name]);
  
  return (
    <div className="space-y-1">
      <input
        ref={mergedRef}
        id={name}
        name={name}
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={props.disabled || isSubmitting}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? `${name}-error` : undefined}
        {...props}
      />
      
      {hasError && (
        <div id={`${name}-error`} className="text-sm text-destructive">
          {fieldError}
        </div>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

/**
 * Form Textarea Component with built-in validation
 */
export interface FormTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'form'> {
  /**
   * Field name
   */
  name: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(({
  name,
  className,
  value,
  onChange,
  onBlur,
  ...props
}, ref) => {
  const {
    values: formValues,
    errors: formErrors,
    touched: formTouched,
    isSubmitting,
    onFieldChange,
    onFieldBlur,
    registerField,
    showErrors,
  } = useFormContext();

  const fieldValue = formValues[name] ?? value ?? '';
  const fieldError = formErrors[name];
  const fieldTouched = formTouched[name];
  const hasError = fieldTouched && fieldError && showErrors;
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Merge refs
  const mergedRef = useCallback((element: HTMLTextAreaElement) => {
    textareaRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    registerField?.(name, element);
  }, [ref, registerField, name]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e);
    onFieldChange?.(name, e.target.value);
  }, [onChange, onFieldChange, name]);
  
  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    onBlur?.(e);
    onFieldBlur?.(name);
  }, [onBlur, onFieldBlur, name]);
  
  return (
    <div className="space-y-1">
      <textarea
        ref={mergedRef}
        id={name}
        name={name}
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={props.disabled || isSubmitting}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-vertical",
          hasError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? `${name}-error` : undefined}
        {...props}
      />
      
      {hasError && (
        <div id={`${name}-error`} className="text-sm text-destructive">
          {fieldError}
        </div>
      )}
    </div>
  );
});

FormTextarea.displayName = 'FormTextarea';

/**
 * Form Select Component with built-in validation
 */
export interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'form'> {
  /**
   * Field name
   */
  name: string;
  
  /**
   * Options for the select
   */
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(({
  name,
  options = [],
  className,
  value,
  onChange,
  onBlur,
  children,
  ...props
}, ref) => {
  const {
    values: formValues,
    errors: formErrors,
    touched: formTouched,
    isSubmitting,
    onFieldChange,
    onFieldBlur,
    registerField,
    showErrors,
  } = useFormContext();

  const fieldValue = formValues[name] ?? value ?? '';
  const fieldError = formErrors[name];
  const fieldTouched = formTouched[name];
  const hasError = fieldTouched && fieldError && showErrors;
  
  const selectRef = useRef<HTMLSelectElement>(null);
  
  // Merge refs
  const mergedRef = useCallback((element: HTMLSelectElement) => {
    selectRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    registerField?.(name, element);
  }, [ref, registerField, name]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e);
    onFieldChange?.(name, e.target.value);
  }, [onChange, onFieldChange, name]);
  
  const handleBlur = useCallback((e: React.FocusEvent<HTMLSelectElement>) => {
    onBlur?.(e);
    onFieldBlur?.(name);
  }, [onBlur, onFieldBlur, name]);
  
  return (
    <div className="space-y-1">
      <select
        ref={mergedRef}
        id={name}
        name={name}
        value={fieldValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={props.disabled || isSubmitting}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? `${name}-error` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      
      {hasError && (
        <div id={`${name}-error`} className="text-sm text-destructive">
          {fieldError}
        </div>
      )}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';