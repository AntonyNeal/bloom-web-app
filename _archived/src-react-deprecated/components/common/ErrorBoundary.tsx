import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-cream-100 to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Friendly Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-sage-500" />
              </div>
            </div>

            {/* Warm Headline */}
            <h1 className="text-3xl font-semibold text-text-primary mb-3 font-display">
              Something's Not Quite Right
            </h1>

            {/* Encouraging Copy */}
            <p className="text-text-secondary mb-8 leading-loose font-body">
              Don't worry—this happens sometimes. We've noted the issue and will look into it. 
              In the meantime, let's get you back on track.
            </p>

            {/* Clear Action Button */}
            <button
              onClick={this.handleReset}
              className="w-full bg-sage-600 hover:bg-sage-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md font-body"
            >
              Return to Dashboard
            </button>

            {/* Optional: Subtle support hint */}
            <p className="text-sm text-text-tertiary mt-6 font-body">
              If this keeps happening,{' '}
              <a href="mailto:support@lifepsychology.com.au" className="text-sage-600 hover:text-sage-700 underline">
                let us know
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
