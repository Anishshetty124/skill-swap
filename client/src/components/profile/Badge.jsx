import React from 'react';
import { CheckBadgeIcon, SparklesIcon, UserPlusIcon, ShieldCheckIcon, TrophyIcon } from '@heroicons/react/24/solid';

const badgeStyles = {
  // Existing Badges
  'New Member': { icon: <UserPlusIcon className="h-5 w-5 mr-1" />, color: 'bg-green-100 text-green-800' },
  'Skill Sharer': { icon: <SparklesIcon className="h-5 w-5 mr-1" />, color: 'bg-blue-100 text-blue-800' },
  'Expert Sharer': { icon: <CheckBadgeIcon className="h-5 w-5 mr-1" />, color: 'bg-indigo-100 text-indigo-800' },
  'First Swap': { icon: <ShieldCheckIcon className="h-5 w-5 mr-1" />, color: 'bg-purple-100 text-purple-800' },
  // New Tiered Badges
  'Silver Swapper': { icon: <TrophyIcon className="h-5 w-5 mr-1" />, color: 'bg-slate-200 text-slate-800' },
  'Gold Swapper': { icon: <TrophyIcon className="h-5 w-5 mr-1" />, color: 'bg-yellow-200 text-yellow-800' },
  'Platinum Swapper': { icon: <TrophyIcon className="h-5 w-5 mr-1" />, color: 'bg-cyan-200 text-cyan-800' },
  'Pro Swapper': { icon: <TrophyIcon className="h-5 w-5 mr-1" />, color: 'text-yellow-900', gradient: 'bg-gradient-to-r from-yellow-400 to-amber-500' },
};

const Badge = ({ name }) => {
  const style = badgeStyles[name] || { icon: null, color: 'bg-gray-100 text-gray-800' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.color} ${style.gradient || ''}`}>
      {style.icon}
      {name}
    </span>
  );
};

export default Badge;