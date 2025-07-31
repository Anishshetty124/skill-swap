import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StarIcon, MapPinIcon, BookmarkIcon } from '@heroicons/react/24/solid';

const SkillCard = ({ skill, hideUser = false }) => {
  const { isAuthenticated, bookmarks, toggleBookmark } = useAuth();
  const isBookmarked = bookmarks.includes(skill._id);
  const borderColor = skill.type === 'OFFER' ? 'border-blue-500' : 'border-green-500';

  return (
    <div className={`bg-neutral-100 dark:bg-gray-800 rounded-lg shadow-xl hover:shadow-2xl overflow-hidden border-l-4 ${borderColor} transition-transform duration-300 hover:scale-105`}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-2">{skill.title}</h3>
          {isAuthenticated && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleBookmark(skill._id); }} 
              className="text-gray-400 hover:text-yellow-400 transition-colors flex-shrink-0"
              aria-label="Bookmark skill"
            >
              {/* Updated to use BookmarkIcon */}
              <BookmarkIcon className={`h-6 w-6 ${isBookmarked ? 'text-accent-500 fill-current' : 'text-slate-400'}`} />
            </button>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4 h-16 overflow-hidden">
          {skill.description?.substring(0, 100)}{skill.description?.length > 100 && '...'}
        </p>

        {/* Added Credits Display */}
        <div className="flex items-center text-sm font-bold text-amber-500 mb-4">
          <span>💰 {skill.costInCredits} Credits</span>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1 text-gray-400"/>
            <span>{skill.locationString}</span>
          </div>
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 mr-1 text-yellow-400"/>
            <span>{skill.averageRating} ({skill.ratings?.length || 0})</span>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center">
          {!hideUser && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Posted by:
              <Link 
                to={`/profile/${skill.user?.username}`} 
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline ml-1"
              >
                {skill.user?.username || 'Anonymous'}
              </Link>
            </div>
          )}
          <Link
            to={`/skills/${skill._id}`}
            className={`px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex-shrink-0 ${hideUser ? 'ml-auto' : ''}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SkillCard;