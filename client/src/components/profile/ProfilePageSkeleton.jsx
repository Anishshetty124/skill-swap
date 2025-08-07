import React from 'react';
import SkillCardSkeleton from '../skills/SkillCardSkeleton';

const ProfilePageSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-lg mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
          <div className="flex-1 w-full">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          </div>
        </div>
        <div className="border-t dark:border-slate-700 mt-6 pt-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex space-x-8">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
        </div>
      </div>

      {/* Skills Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <SkillCardSkeleton key={i} />)}
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;
