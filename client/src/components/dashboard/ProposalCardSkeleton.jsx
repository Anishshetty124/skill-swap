import React from 'react';

const ProposalCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border-l-4 border-slate-300 dark:border-slate-600 animate-pulse">
      <div className="flex justify-between items-center mb-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/5"></div>
      </div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      <div className="flex justify-end items-center space-x-3 mt-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
      </div>
    </div>
  );
};

export default ProposalCardSkeleton;