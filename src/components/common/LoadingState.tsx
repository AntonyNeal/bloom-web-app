const LoadingState = () => {
  return (
    <div className="space-y-4">
      {/* Show 3 skeleton cards */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[#8B9E87]/5 rounded-lg p-6 animate-pulse"
          style={{ height: '120px' }}
        >
          <div className="flex items-start gap-4">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            
            <div className="flex-1 space-y-3">
              {/* Name skeleton */}
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              
              {/* Email skeleton */}
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              
              {/* Details skeleton */}
              <div className="flex gap-3">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-32" />
              </div>
            </div>

            {/* Badge skeleton */}
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingState;
