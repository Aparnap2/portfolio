import { memo, useState, useCallback, useEffect } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsLoading, useError, useAuditStore } from '@/stores/audit-store';
import { formValidation } from '@/lib/validation';
import { useToast } from '@/components/ui/toast-provider';
import { Form, FormInput } from '@/components/ui/form';
import { ValidationFeedback, useRealTimeValidation } from '@/components/ui/validation-feedback';
import { z } from 'zod';

interface ChatInputProps {
  className?: string;
}

const getPlaceholder = () => {
  return "Type your message...";
};

export const ChatInput = memo<ChatInputProps>(({ className }) => {
  const [inputValue, setInputValue] = useState('');
  const isLoading = useIsLoading();
  const error = useError();
  const { submitMessage } = useAuditStore();
  const { addToast } = useToast();

  // Create validation schema for the message field
  const messageSchema = z.string()
    .min(1, "Message cannot be empty")
    .min(3, "Message must be at least 3 characters")
    .max(2000, "Message must be less than 2000 characters")
    .refine(
      (val) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(val),
      "Invalid characters detected"
    );

  const validator = useCallback((value: string) => {
    return formValidation.validateMessageField(value);
  }, []);

  // Real-time validation with debouncing
  const { validation: messageValidation, isValidating: isValidationLoading } = useRealTimeValidation(
    inputValue,
    validator
  );

  const onSubmit = useCallback(async (values: Record<string, any>) => {
    try {
      await submitMessage(values.message);
      setInputValue('');
    } catch (error) {
      console.error('Failed to submit message:', error);
      addToast({
        type: 'error',
        title: 'Message Failed',
        message: 'Unable to send your message. Please try again.'
      });
    }
  }, [submitMessage, addToast]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Form will handle submission
    }
  }, []);

  const hasError = error;
  const canSubmit = inputValue.trim() && !isLoading && messageValidation.valid && !isValidationLoading;

  return (
    <div className={cn("px-3 sm:px-4 lg:px-6 py-2 sm:py-3 border-t border-neutral-800", className)}>
      {hasError && (
        <div className="mb-2 p-2 bg-red-900/50 text-red-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      
      <Form
        onSubmit={onSubmit}
        initialValues={{ message: inputValue }}
        validation={{ message: messageSchema }}
        onChange={(values, field, value) => {
          if (field === 'message') {
            setInputValue(value);
          }
        }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <FormInput
              name="message"
              type="text"
              placeholder={getPlaceholder()}
              disabled={isLoading}
              className={cn(
                "w-full px-3 py-2 bg-neutral-900 text-white rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 text-sm border transition-colors",
                messageValidation.error
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : messageValidation.valid
                  ? "border-green-500 focus:ring-green-500 focus:border-green-500"
                  : "border-neutral-800 focus:ring-purple-500 focus:border-purple-500"
              )}
              onKeyDown={handleKeyPress}
            />
            {isValidationLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "p-2 text-white rounded-lg transition-colors flex items-center justify-center",
              canSubmit
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-neutral-700 cursor-not-allowed opacity-50"
            )}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        
        {/* Real-time validation feedback */}
        <ValidationFeedback
          value={inputValue}
          validation={messageValidation}
          immediate={true}
          showCharCount={true}
          maxChars={2000}
          className="mt-2"
        />
      </Form>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';
