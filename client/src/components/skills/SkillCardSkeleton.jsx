import React from 'react';

const SkillCardSkeleton = () => {
  return (
    <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
      <div className="animate-pulse flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-6 w-6 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div className="space-y-3 mt-4">
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center">
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-10 bg-slate-300 dark:bg-slate-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
};

export default SkillCardSkeleton;