import React, { memo, useState, useEffect, useCallback } from 'react';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useEmailCapture } from '@/hooks/useEmailCapture';
import { formValidation } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Form, FormInput } from '@/components/ui/form';
import { ValidationFeedback, useRealTimeValidation } from '@/components/ui/validation-feedback';
import { z } from 'zod';

interface EmailCaptureScreenProps {
  onCapture: () => void;
}

export const EmailCaptureScreen = memo<EmailCaptureScreenProps>(({ onCapture }) => {
  const {
    emailValue,
    setEmailValue,
    isSending,
    error,
    captureEmail,
  } = useEmailCapture();
  
  const [validationError, setValidationError] = useState<string | null>(null);


  // Create validation schema for the email field
  const emailSchema = z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine(
      (val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val),
      "Invalid characters detected"
    );

  const validator = useCallback((value: string) => {
    return formValidation.validateEmailField(value);
  }, []);

  // Real-time email validation with debouncing
  const { validation: emailValidation, isValidating } = useRealTimeValidation(
    emailValue,
    validator
  );
  
  useEffect(() => {
    setValidationError(emailValidation.error || null);
  }, [emailValidation]);

  const onSubmit = async (values: Record<string, any>) => {
    try {
      await captureEmail(values.email);
      onCapture();
    } catch (error) {
      console.error('Failed to capture email:', error);
      setValidationError('Failed to submit email. Please try again.');
    }
  };

  const hasError = error || validationError;
  const canSubmit = emailValue.trim() && !isSending && emailValidation.valid && !isValidating;

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-purple-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">AI Opportunity Assessment</h3>
      <p className="text-neutral-400 mb-6">
        Get a personalized automation roadmap in 5 minutes. Enter your email to begin.
      </p>
      <div className="space-y-3 w-full max-w-sm">
        <Form
          onSubmit={onSubmit}
          initialValues={{ email: emailValue }}
          validation={{ email: emailSchema }}
          onChange={(values, field, value) => {
            if (field === 'email') {
              setEmailValue(value);
            }
          }}
          className="space-y-3"
        >
          <div className="relative">
            <FormInput
              name="email"
              type="email"
              placeholder="Enter your email address"
              required
              className={cn(
                "w-full px-4 py-3 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 text-sm border transition-colors pr-10",
                emailValidation.error
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : emailValidation.valid
                  ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                  : "border-neutral-800 focus:ring-purple-500 focus:border-purple-500"
              )}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              ) : emailValidation.valid && emailValue ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : emailValidation.error ? (
                <AlertCircle size={16} className="text-red-500" />
              ) : null}
            </div>
          </div>
          
          {validationError && (
            <div className="p-2 bg-red-900/50 text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle size={12} />
              {validationError}
            </div>
          )}
          
          {/* Real-time validation feedback */}
          <ValidationFeedback
            value={emailValue}
            validation={emailValidation}
            immediate={true}
            showCharCount={true}
            maxChars={254}
            className="mt-2"
          />
          
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "w-full px-6 py-3 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-medium",
              canSubmit
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-neutral-700 cursor-not-allowed opacity-50"
            )}
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Starting...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Start Assessment
              </>
            )}
          </button>
        </Form>
        
        {error && (
          <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
        
        <p className="text-xs text-neutral-500">
          We'll send your report to this email. No spam, unsubscribe anytime.
        </p>
      </div>
    </div>
  );
});

EmailCaptureScreen.displayName = 'EmailCaptureScreen';