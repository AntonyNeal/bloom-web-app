/**
 * Error Boundary Hook
 *
 * Provides error boundary functionality with consistent error handling
 */

import { useEffect, useState } from 'react';
import { logger } from '../utils/logger';

export interface ErrorInfo {
  error: Error;
  errorInfo?: React.ErrorInfo;
  timestamp: Date;
}

export function useErrorBoundary() {
  const [error, setError] = useState<ErrorInfo | null>(null);

  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      logger.error('Uncaught error:', 'ErrorBoundary', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });

      setError({
        error: event.error || new Error(event.message),
        timestamp: new Date(),
      });
    };

    // Unhandled promise rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection:', 'ErrorBoundary', {
        reason: event.reason,
      });

      setError({
        error:
          event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason)),
        timestamp: new Date(),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const clearError = () => setError(null);

  const logError = (error: Error, context?: string) => {
    logger.error(error.message, context, {
      stack: error.stack,
      name: error.name,
    });

    setError({
      error,
      timestamp: new Date(),
    });
  };

  return {
    error,
    clearError,
    logError,
    hasError: error !== null,
  };
}
