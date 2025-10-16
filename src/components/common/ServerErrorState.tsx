import { Wrench } from 'lucide-react';

interface ServerErrorStateProps {
  onRetry: () => void;
  errorCode?: number;
}

const ServerErrorState = ({ onRetry, errorCode }: ServerErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {/* Tool/wrench icon - suggesting we're fixing it */}
      <div className="mb-6">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
          <Wrench className="w-8 h-8 text-gray-500" />
        </div>
      </div>

      {/* Warm headline */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-3 font-poppins">
        Something Went Wrong
      </h2>

      {/* Reassuring copy */}
      <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
        Don't worry—your applications are safe. We're looking into this. 
        Try refreshing the page or come back shortly.
      </p>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Primary: Refresh */}
        <button
          onClick={onRetry}
          className="bg-[#8B9E87] hover:bg-[#7a8c78] text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Refresh
        </button>

        {/* Secondary: Contact Support */}
        <a
          href="mailto:support@lifepsychology.com.au"
          className="text-[#8B9E87] hover:text-[#7a8c78] font-medium underline"
        >
          Contact Support
        </a>
      </div>

      {/* Optional: Error code for support reference */}
      {errorCode && (
        <p className="text-xs text-gray-400 mt-6">
          Error code: {errorCode} (for support reference)
        </p>
      )}
    </div>
  );
};

export default ServerErrorState;
