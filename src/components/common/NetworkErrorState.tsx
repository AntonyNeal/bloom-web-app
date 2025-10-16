import { WifiOff } from 'lucide-react';

interface NetworkErrorStateProps {
  onRetry: () => void;
  lastAttempt?: Date;
}

const NetworkErrorState = ({ onRetry, lastAttempt }: NetworkErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
      {/* WiFi icon with subtle, not alarming design */}
      <div className="mb-6">
        <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-sage-400" />
        </div>
      </div>

      {/* Warm headline */}
      <h2 className="text-2xl font-semibold text-text-primary mb-3 font-display">
        Unable to Connect
      </h2>

      {/* Helpful copy */}
      <p className="text-text-secondary max-w-md mb-8 leading-loose font-body">
        We're having trouble reaching the server. This usually resolves quickly. 
        Check your internet connection and try again.
      </p>

      {/* Primary action: Retry */}
      <button
        onClick={onRetry}
        className="bg-sage-600 hover:bg-sage-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md font-body"
      >
        Try Again
      </button>

      {/* Secondary helpful text */}
      <p className="text-sm text-text-tertiary mt-6 font-body">
        Or check back in a few minutes
      </p>

      {/* Optional: Last attempt timestamp for debugging */}
      {lastAttempt && (
        <p className="text-xs text-text-tertiary mt-4 font-mono">
          Last attempt: {lastAttempt.toLocaleTimeString('en-AU', { hour12: true })}
        </p>
      )}
    </div>
  );
};

export default NetworkErrorState;
