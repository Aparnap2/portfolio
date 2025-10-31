import React, { memo } from 'react';
import { Check, Send } from 'lucide-react';
import { useEmailCapture } from '@/hooks/useEmailCapture';

export const CompletionScreen = memo(() => {
  const {
    emailValue,
    setEmailValue,
    isSending,
    emailSent,
    error,
    sendReport,
  } = useEmailCapture();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.trim() || isSending) return;
    
    await sendReport(emailValue);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Assessment Complete!</h3>
      <p className="text-neutral-400 mb-6">
        Your AI opportunity assessment has been completed. Enter your email to receive the detailed report.
      </p>
      <div className="space-y-3 w-full">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="Enter your email address"
            required
            className="w-full px-4 py-3 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm border border-neutral-800 focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isSending || !emailValue.trim()}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Report to Email
              </>
            )}
          </button>
        </form>
        {emailSent && (
          <div className="p-3 bg-green-900/50 text-green-300 rounded-lg text-sm">
            ✅ Report sent successfully! Check your email.
          </div>
        )}
        {error && (
          <div className="p-3 bg-red-900/50 text-red-300 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
});

CompletionScreen.displayName = 'CompletionScreen';