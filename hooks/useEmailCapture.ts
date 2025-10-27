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
          const response = await withRetry(() =>
            fetch('/api/audit/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: validEmail }),
            })
          );

          if (!response.ok) throw new Error('Failed to start session');

          const data = await response.json();
          
          useAuditStore.setState({
            sessionId: data.sessionId,
            messages: data.response?.messages || [],
            currentPhase: data.response?.current_step || 'discovery'
          });

          setCaptured(true);
        } catch (err) {
          setError('Failed to start audit. Please try again.');
        } finally {
          setIsSending(false);
        }
      },
      () => setError('An unexpected error occurred')
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
      () => setError('An unexpected error occurred')
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