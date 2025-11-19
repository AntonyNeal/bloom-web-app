import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-orange-50/10">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-b-2 border-blue-600 mb-4`}
      ></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
