import React from 'react';
import { Link } from 'react-router-dom';

const SkillCard = ({ skill }) => {
  // Determine card border color based on skill type for quick visual identification
  const borderColor = skill.type === 'OFFER' ? 'border-blue-500' : 'border-green-500';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${borderColor}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {skill.title}
          </h3>
          <span className="flex-shrink-0 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full ml-2">
            {skill.category}
          </span>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4 h-16 overflow-hidden">
          {skill.description.substring(0, 100)}{skill.description.length > 100 && '...'}
        </p>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Posted by:
            {/* This is the updated part: The username is now a clickable link */}
            <Link 
              to={`/profile/${skill.user?.username}`} 
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
            >
              {skill.user?.username || 'Anonymous'}
            </Link>
          </div>
          
          <Link
            to={`/skills/${skill._id}`}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex-shrink-0"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SkillCard;