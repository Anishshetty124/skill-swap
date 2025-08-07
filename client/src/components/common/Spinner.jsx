import React from 'react';

const Spinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div 
        className={`animate-spin rounded-full border-4 border-slate-200 border-t-accent-500 ${sizeClasses[size]}`}
      ></div>
      {text && <p className="text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
};

export default Spinner;
