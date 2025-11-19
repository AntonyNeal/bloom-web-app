import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR] ErrorBoundary - Uncaught error:', error, errorInfo);
    if (window && window.localStorage) {
      try {
        window.localStorage.setItem(
          'lastError',
          JSON.stringify({ error: error.toString(), errorInfo })
        );
        console.log('[LOG] ErrorBoundary - Error saved to localStorage');
      } catch (e) {
        console.error(
          '[ERROR] ErrorBoundary - Failed to save error to localStorage:',
          e
        );
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try
                refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
