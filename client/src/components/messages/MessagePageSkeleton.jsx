import React from 'react';

const MessagesPageSkeleton = () => {
  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden animate-pulse">
      {/* Skeleton for Conversation List */}
      <div className="md:col-span-1 border-r border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4 border-b border-slate-100 dark:border-slate-700/50">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
              <div className="flex-grow space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton for Chat Window */}
      <div className="md:col-span-2 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
            </div>
            <div className="h-6 w-6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>
        <div className="flex-1 p-4">
            {/* Placeholder for messages */}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPageSkeleton;
