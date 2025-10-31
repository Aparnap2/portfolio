import { useState, useCallback } from 'react';
import { useAuditStore } from '@/stores/audit-store';
import { withErrorBoundary, withRetry } from '@/lib/error-handling';
import { validateAndSanitize, schemas } from '@/lib/validation';

export function useEmailCapture() {
  const [emailValue, setEmailValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(false);

  const { sessionId } = useAuditStore();

  const captureEmail = useCallback(
    withErrorBoundary(
      async (email: string) => {
        if (isSending) return;
        
        const validEmail = validateAndSanitize(schemas.email, email);
        setIsSending(true);
        setError('');

        try {
          console.log('[useEmailCapture] Starting audit for email:', validEmail);
          const response = await withRetry(() =>
            fetch('/api/audit/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: validEmail }),
            })
          );

          console.log('[useEmailCapture] Response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[useEmailCapture] Response error:', errorText);
            throw new Error(`Failed to start session: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log('[useEmailCapture] Response data:', data);
          
          useAuditStore.setState({
            sessionId: data.sessionId,
            messages: data.response?.messages || [],
            currentPhase: data.response?.current_step || 'discovery'
          });

          setCaptured(true);
        } catch (err) {
          console.error('[useEmailCapture] Error:', err);
          setError(`Failed to start audit: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
          setIsSending(false);
        }
      },
      {
        fallback: async () => setError('An unexpected error occurred'),
        onError: (error) => console.error('Email capture error:', error)
      }
    ),
    [isSending]
  );

  const sendReport = useCallback(
    withErrorBoundary(
      async (email: string) => {
        if (!sessionId || isSending) return;
        
        const validEmail = validateAndSanitize(schemas.email, email);
        setIsSending(true);
        setError('');
        setEmailSent(false);

        try {
          const response = await withRetry(() =>
            fetch('/api/audit/send-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId, email: validEmail }),
            })
          );

          const result = await response.json();

          if (result.success) {
            setEmailSent(true);
            // Fire and forget notifications
            Promise.allSettled([
              fetch('/api/audit/notify-discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              }),
              fetch('/api/audit/save-hubspot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId }),
              }),
            ]);
          } else {
            setError(result.error || 'Failed to send report');
          }
        } catch (err) {
          setError('Failed to send report. Please try again.');
        } finally {
          setIsSending(false);
        }
      },
      {
        fallback: async () => setError('An unexpected error occurred'),
        onError: (error) => console.error('Send report error:', error)
      }
    ),
    [sessionId, isSending]
  );

  return {
    emailValue,
    setEmailValue,
    isSending,
    emailSent,
    error,
    captured,
    captureEmail,
    sendReport,
  };
}