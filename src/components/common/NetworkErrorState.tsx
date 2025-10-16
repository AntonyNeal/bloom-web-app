import { WifiOff } from 'lucide-react';

interface NetworkErrorStateProps {
  onRetry: () => void;
  lastAttempt?: Date;
}

const NetworkErrorState = ({ onRetry, lastAttempt }: NetworkErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {/* WiFi icon with subtle, not alarming design */}
      <div className="mb-6">
        <div className="w-16 h-16 rounded-full bg-[#8B9E87]/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-[#8B9E87]" />
        </div>
      </div>

      {/* Warm headline */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-3 font-poppins">
        Unable to Connect
      </h2>

      {/* Helpful copy */}
      <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
        We're having trouble reaching the server. This usually resolves quickly. 
        Check your internet connection and try again.
      </p>

      {/* Primary action: Retry */}
      <button
        onClick={onRetry}
        className="bg-[#8B9E87] hover:bg-[#7a8c78] text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
      >
        Try Again
      </button>

      {/* Secondary helpful text */}
      <p className="text-sm text-gray-500 mt-6">
        Or check back in a few minutes
      </p>

      {/* Optional: Last attempt timestamp for debugging */}
      {lastAttempt && (
        <p className="text-xs text-gray-400 mt-4">
          Last attempt: {lastAttempt.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default NetworkErrorState;
