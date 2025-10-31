'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home, MessageCircle, Bug } from 'lucide-react';
import { ErrorRecovery } from '@/lib/error-handling';
import { MetricsCollector } from '@/lib/metrics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReportButton?: boolean;
  maxRetries?: number;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
  lastErrorTime?: number;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;
  private metrics = MetricsCollector.getInstance();

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
      retryCount: 0,
      isRecovering: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name = 'ErrorBoundary' } = this.props;

    // Track error metrics
    this.metrics.increment('error_boundary_caught', 1, {
      component: name,
      error_type: error.constructor.name,
      recoverable: ErrorRecovery.isRecoverable(error).toString()
    });

    // Enhanced Sentry reporting
    Sentry.captureException(error, {
      tags: {
        component: name,
        error_boundary: 'true',
        recoverable: ErrorRecovery.isRecoverable(error)
      },
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        error_boundary: {
          retryCount: this.state.retryCount,
          errorId: this.state.errorId,
          lastErrorTime: this.state.lastErrorTime
        }
      },
      extra: {
        userMessage: ErrorRecovery.getUserMessage(error),
        errorId: this.state.errorId
      }
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Auto-retry for recoverable errors
    this.attemptRecovery(error);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private attemptRecovery = (error: Error) => {
    const { maxRetries = 2 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries || !ErrorRecovery.isRecoverable(error)) {
      return;
    }

    const delay = ErrorRecovery.getRetryDelay(error, 1000 * (retryCount + 1));

    this.setState({ isRecovering: true });

    this.retryTimeoutId = setTimeout(() => {
      this.metrics.increment('error_boundary_recovery_attempt', 1, {
        attempt: (retryCount + 1).toString()
      });

      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1,
        lastErrorTime: Date.now(),
        isRecovering: false
      }));
    }, delay);
  };

  private handleManualRetry = () => {
    this.metrics.increment('error_boundary_manual_retry', 1);

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1,
      lastErrorTime: Date.now(),
      isRecovering: false
    }));
  };

  private handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      // Send error report to monitoring system
      this.metrics.increment('error_boundary_user_report', 1);

      Sentry.captureMessage('User reported error boundary issue', {
        level: 'info',
        tags: {
          user_reported: 'true',
          error_id: this.state.errorId
        },
        extra: {
          error: this.state.error.message,
          errorId: this.state.errorId,
          retryCount: this.state.retryCount
        }
      });
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isRecovering, retryCount, errorId } = this.state;
      const { showReportButton = true, maxRetries = 2 } = this.props;
      const userMessage = error ? ErrorRecovery.getUserMessage(error) : 'Something went wrong';

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            Oops! Something went wrong
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
            {userMessage}
          </p>

          {errorId && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mb-4 font-mono">
              Error ID: {errorId}
            </div>
          )}

          {isRecovering && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-4">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Attempting to recover...
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {retryCount < maxRetries && !isRecovering && (
              <button
                onClick={this.handleManualRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            )}

            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Home size={16} />
              Go Home
            </button>

            {showReportButton && (
              <button
                onClick={this.handleReportError}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Bug size={16} />
                Report Issue
              </button>
            )}
          </div>

          {retryCount > 0 && (
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
              Retry attempts: {retryCount}/{maxRetries}
            </div>
          )}

          <details className="mt-6 w-full max-w-md">
            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-left text-xs font-mono text-gray-800 dark:text-gray-200">
              {error?.message}
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}