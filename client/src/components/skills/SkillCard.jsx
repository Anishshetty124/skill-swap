import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SkillCard = ({ skill, hideUser = false }) => {
  const { isAuthenticated, bookmarks, toggleBookmark } = useAuth();
  const isBookmarked = bookmarks.includes(skill._id);
  const borderColor = skill.type === 'OFFER' ? 'border-blue-500' : 'border-green-500';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 ${borderColor}`}>
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-2">{skill.title}</h3>
          {isAuthenticated && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleBookmark(skill._id); }} 
              className="text-gray-400 hover:text-yellow-400 transition-colors flex-shrink-0"
              aria-label="Bookmark skill"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4 h-16 overflow-hidden">
          {skill.description.substring(0, 100)}{skill.description.length > 100 && '...'}
        </p>

        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>{skill.locationString}</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
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