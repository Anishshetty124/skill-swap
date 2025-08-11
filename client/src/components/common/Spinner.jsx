import React from 'react';

/**
 * A modern, attractive spinner component with a three-dot wave animation.
 * @param {object} props - The component props.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The size of the spinner dots.
 * @param {string} [props.text='Loading...'] - The text to display below the spinner. Can be an empty string.
 */
const Spinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8" role="status" aria-live="polite">
      <div className="flex items-center justify-center space-x-2">
        {/* Each div is a dot. The animation is applied via Tailwind classes. */}
        <div 
          className={`bg-accent-500 rounded-full animate-wave ${sizeClasses[size]}`}
          style={{ animationDelay: '0s' }}
        ></div>
        <div 
          className={`bg-accent-500 rounded-full animate-wave ${sizeClasses[size]}`}
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div 
          className={`bg-accent-500 rounded-full animate-wave ${sizeClasses[size]}`}
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
      {/* The text remains optional and styled the same way. */}
      {text && <p className="text-slate-500 dark:text-slate-400 text-sm">{text}</p>}
    </div>
  );
};

export default Spinner;