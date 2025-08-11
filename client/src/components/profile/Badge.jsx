import React from 'react';
import { SparklesIcon, UserGroupIcon, AcademicCapIcon, StarIcon } from '@heroicons/react/24/solid';

const Badge = ({ name }) => {
  const badgeStyles = {
    'New Member': {
      icon: <UserGroupIcon />,
      color: 'from-gray-600 to-gray-800',
      glow: 'shadow-[0_0_4px_0_rgba(107,114,128,0.3)]',
      tooltip: 'Joined recently',
    },
    'Skill Sharer': {
      icon: <AcademicCapIcon />,
      color: 'from-blue-400 to-blue-600',
      glow: 'shadow-[0_0_4px_0_rgba(59,130,246,0.2)]',
      tooltip: 'Shared at least one skill',
    },
    'Silver Sharer': {
      icon: <AcademicCapIcon />,
      color: 'from-slate-500 to-slate-700',
      glow: 'shadow-[0_0_4px_0_rgba(100,116,139,0.3)]',
      tooltip: 'Shared 5+ skills',
    },
    'Gold Sharer': {
      icon: <AcademicCapIcon />,
      color: 'from-yellow-500 to-yellow-600',
      glow: 'shadow-[0_0_6px_1px_rgba(202,138,4,0.3)]',
      tooltip: 'Shared 10+ skills',
    },
    'Expert Sharer': {
      icon: <StarIcon />,
      color: 'from-purple-600 to-purple-800',
      glow: 'shadow-[0_0_6px_1px_rgba(139,92,246,0.3)]',
      tooltip: 'Shared 20+ skills',
    },
    'Swap Starter': {
      icon: <SparklesIcon />,
      color: 'from-green-400 to-green-600',
      glow: 'shadow-[0_0_3px_0_rgba(34,197,94,0.15)]',
      tooltip: 'Completed 1st swap',
    },
    'Silver Swapper': {
      icon: <SparklesIcon />,
      color: 'from-slate-400 to-slate-600',
      glow: 'shadow-[0_0_3px_0_rgba(148,163,184,0.15)]',
      tooltip: 'Completed 5+ swaps',
    },
    'Gold Swapper': {
      icon: <SparklesIcon />,
      color: 'from-yellow-500 to-yellow-600',
      glow: 'shadow-[0_0_6px_1px_rgba(202,138,4,0.3)]',
      tooltip: 'Completed 10+ swaps',
    },
    'Expert Swapper': {
      icon: <StarIcon />,
      color: 'from-purple-600 to-purple-800',
      glow: 'shadow-[0_0_6px_1px_rgba(139,92,246,0.3)]',
      tooltip: 'Completed 20+ swaps',
    },
  };

  const style = badgeStyles[name] || {
    icon: <StarIcon />,
    color: 'from-gray-500 to-gray-700',
    glow: 'shadow-[0_0_4px_0_rgba(107,114,128,0.2)]',
    tooltip: 'Achievement',
  };

  return (
    <div className="relative group inline-block">
      <div
        className={`flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold bg-gradient-to-br ${style.color} ${style.glow} transition-all duration-300`}
        style={{ filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.1))' }}
      >
        <div className="h-5 w-5">{style.icon}</div>
        <span>{name}</span>
      </div>
      <div
        className="absolute bottom-full mb-2 w-max px-3 py-1.5 bg-slate-900 bg-opacity-90 text-white text-xs font-semibold rounded-md
        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-x-1/2 left-1/2 whitespace-nowrap"
      >
        {style.tooltip}
      </div>
    </div>
  );
};

export default Badge;
