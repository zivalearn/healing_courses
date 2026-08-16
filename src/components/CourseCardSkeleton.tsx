import React from 'react';

interface CourseCardSkeletonProps {
  count?: number;
}

export const CourseCardSkeleton: React.FC<CourseCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-4 border border-[#C8E6E1] flex flex-col h-full animate-pulse space-y-3"
        >
          {/* Thumbnail Skeleton */}
          <div className="h-36 sm:h-40 bg-gray-200/80 rounded-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>

          {/* Badge & Meta Skeleton */}
          <div className="flex justify-between items-center pt-1">
            <div className="h-3 w-20 bg-gray-200 rounded-md" />
            <div className="h-4 w-12 bg-amber-100 rounded-md" />
          </div>

          {/* Title Skeleton */}
          <div className="space-y-2">
            <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
            <div className="h-3 w-full bg-gray-100 rounded-md" />
            <div className="h-3 w-5/6 bg-gray-100 rounded-md" />
          </div>

          {/* Footer & Buttons Skeleton */}
          <div className="pt-3 border-t border-[#C8E6E1] grid grid-cols-2 gap-2 mt-auto">
            <div className="h-8 bg-gray-200 rounded-lg" />
            <div className="h-8 bg-[#102A36]/20 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
};

export default CourseCardSkeleton;
