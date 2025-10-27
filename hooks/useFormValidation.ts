import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { validateField, formValidation } from '@/lib/validation';

interface ValidationState {
  value: string;
  error: string | null;
  isValid: boolean;
  isValidating: boolean;
  warnings: string[];
}

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValue?: string;
  debounceMs?: number;
  validateOnChange?: boolean;
  showWarnings?: boolean;
}

export function useFormValidation<T>({
  schema,
  initialValue = '',
  debounceMs = 300,
  validateOnChange = true,
  showWarnings = false
}: UseFormValidationOptions<T>) {
  const [state, setState] = useState<ValidationState>({
    value: initialValue,
    error: null,
    isValid: false,
    isValidating: false,
    warnings: []
  });

  const [touched, setTouched] = useState(false);

  const validateValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, isValidating: true }));
    
    const timeoutId = setTimeout(() => {
      const validation = validateField(schema, value);
      const warnings = showWarnings && validation.valid ? 
        getFieldWarnings(value, schema) : [];
      
      setState({
        value,
        error: validation.valid ? null : validation.error || null,
        isValid: validation.valid,
        isValidating: false,
        warnings
      });
    }, debounceMs);

    return timeoutId;
  }, [schema, debounceMs, showWarnings]);

  // Real-time validation
  useEffect(() => {
    if (!validateOnChange || !touched) return;
    
    const timeoutId = validateValue(state.value);
    return () => clearTimeout(timeoutId);
  }, [state.value, validateOnChange, touched, validateValue]);

  const setValue = useCallback((newValue: string) => {
    setState(prev => ({ ...prev, value: newValue }));
    if (!touched) setTouched(true);
  }, [touched]);

  const validate = useCallback(() => {
    const timeoutId = validateValue(state.value);
    clearTimeout(timeoutId); // Clear any pending validation
    
    const validation = validateField(schema, state.value);
    const warnings = showWarnings && validation.valid ? 
      getFieldWarnings(state.value, schema) : [];
    
    setState({
      value: state.value,
      error: validation.valid ? null : validation.error || null,
      isValid: validation.valid,
      isValidating: false,
      warnings
    });

    return validation;
  }, [state.value, schema, showWarnings, validateValue]);

  const reset = useCallback(() => {
    setState({
      value: initialValue,
      error: null,
      isValid: false,
      isValidating: false,
      warnings: []
    });
    setTouched(false);
  }, [initialValue]);

  return {
    value: state.value,
    setValue,
    error: state.error,
    isValid: state.isValid,
    isValidating: state.isValidating,
    warnings: state.warnings,
    touched,
    validate,
    reset,
    hasError: !!state.error,
    hasWarnings: state.warnings.length > 0
  };
}

// Helper function to get field-specific warnings
function getFieldWarnings(value: string, schema: z.ZodSchema): string[] {
  const warnings: string[] = [];
  
  try {
    // Email-specific warnings - check if it's an email schema
    const testEmail = 'test@example.com';
    const emailResult = schema.safeParse(testEmail);
    if (emailResult.success && value.includes('@')) {
      const domain = value.split('@')[1];
      if (domain?.includes('gmail') || domain?.includes('yahoo')) {
        warnings.push('Consider using a business email for better deliverability');
      }
    }
  } catch {
    // Ignore schema inspection errors
  }
  
  // Budget-specific warnings
  if (value.includes('$') || value.toLowerCase().includes('budget')) {
    const numbers = value.match(/\d+/g);
    if (numbers && parseInt(numbers[0]) < 10000) {
      warnings.push('Low budget may limit solution options');
    }
  }
  
  return warnings;
}

// Hook for multi-form validation
export function useMultiFormValidation<T extends Record<string, any>>(
  schemas: { [K in keyof T]: z.ZodSchema<T[K]> },
  initialValues: Partial<T> = {}
) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback((field: keyof T, value: any) => {
    const schema = schemas[field];
    if (!schema) return;

    setIsValidating(true);
    
    try {
      schema.parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ 
          ...prev, 
          [field]: error.errors[0]?.message || 'Invalid input' 
        }));
      }
    } finally {
      setIsValidating(false);
    }
  }, [schemas]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  }, [validateField]);

  const validateAll = useCallback(() => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.entries(schemas).forEach(([field, schema]) => {
      try {
        schema.parse(values[field as keyof T]);
        newErrors[field as keyof T] = undefined;
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors[field as keyof T] = error.errors[0]?.message || 'Invalid input';
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [schemas, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValidating(false);
  }, [initialValues]);

  const hasErrors = Object.values(errors).some(error => !!error);
  const isTouched = Object.values(touched).some(touch => touch);

  return {
    values,
    setValue,
    errors,
    isValidating,
    touched,
    hasErrors,
    isTouched,
    validateAll,
    validateField,
    reset
  };
}

// Hook for async validation (e.g., email uniqueness check)
export function useAsyncValidation<T>(
  validator: (value: T) => Promise<{ valid: boolean; error?: string }>,
  options: {
    debounceMs?: number;
    retryAttempts?: number;
  } = {}
) {
  const { debounceMs = 500, retryAttempts = 2 } = options;
  const [state, setState] = useState<{
    isValidating: boolean;
    isValid: boolean;
    error: string | null;
  }>({
    isValidating: false,
    isValid: false,
    error: null
  });

  const validate = useCallback(async (value: T) => {
    setState(prev => ({ ...prev, isValidating: true, error: null }));
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const result = await validator(value);
        setState({
          isValidating: false,
          isValid: result.valid,
          error: result.error || null
        });
        return result;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retryAttempts) {
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }
    
    setState({
      isValidating: false,
      isValid: false,
      error: lastError?.message || 'Validation failed'
    });
    
    return { valid: false, error: lastError?.message };
  }, [validator, retryAttempts]);

  return {
    ...state,
    validate
  };
}