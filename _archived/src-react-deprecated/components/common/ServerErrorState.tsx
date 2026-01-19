import { Wrench } from 'lucide-react';

interface ServerErrorStateProps {
  onRetry: () => void;
  errorCode?: number;
}

const ServerErrorState = ({ onRetry, errorCode }: ServerErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      {/* Tool/wrench icon - suggesting we're fixing it */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-cream-200 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-text-tertiary" />
        </div>
      </div>

      {/* Warm headline */}
      <h2 className="text-2xl font-semibold text-text-primary mb-3 font-display">
        Something Went Wrong
      </h2>

      {/* Reassuring copy */}
      <p className="text-text-secondary max-w-md mb-4 leading-loose font-body">
        Don't worry—your applications are safe. We're looking into this. 
        Try refreshing the page or come back shortly.
      </p>

      {/* 404 specific message */}
      {errorCode === 404 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mb-8">
          <p className="text-sm text-amber-900 font-body">
            <strong className="font-semibold">API Endpoint Not Found (404)</strong>
            <br />
            The backend API endpoint may not be deployed yet. Please check the Azure Function App deployment status.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Primary: Refresh */}
        <button
          onClick={onRetry}
          className="bg-sage-600 hover:bg-sage-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md font-body"
        >
          Refresh
        </button>

        {/* Secondary: Contact Support */}
        <a
          href="mailto:support@lifepsychology.com.au"
          className="text-sage-600 hover:text-sage-700 font-medium underline font-body"
        >
          Contact Support
        </a>
      </div>

      {/* Optional: Error code for support reference */}
      {errorCode && (
        <p className="text-xs text-text-tertiary mt-6 font-mono">
          Error code: {errorCode} (for support reference)
        </p>
      )}
    </div>
  );
};

export default ServerErrorState;
