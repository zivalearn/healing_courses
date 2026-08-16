import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading Course Studio...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] w-full p-6 space-y-3">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-500">
        {message}
      </p>

      {/* Skeleton Mock Preview */}
      <div className="w-full max-w-xl mt-4 space-y-2.5 bg-white p-5 rounded-lg border border-slate-200/80 shadow-2xs">
        <div className="h-4 bg-slate-200/80 rounded w-1/4 animate-pulse" />
        <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
        <div className="h-16 bg-slate-50 rounded-md w-full animate-pulse mt-3" />
      </div>
    </div>
  );
};

export default LoadingState;
