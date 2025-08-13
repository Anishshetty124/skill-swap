import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StarIcon, MapPinIcon, BookmarkIcon } from '@heroicons/react/24/solid';

const SkillCard = ({ skill, hideUser = false }) => {
  const { user, isAuthenticated, bookmarks, toggleBookmark } = useAuth();
  
  const isOwner = user && skill.user && user._id === skill.user._id;
  const isBookmarked = bookmarks.includes(skill._id);

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOwner) {
      toggleBookmark(skill._id);
    }
  };

  const typeColor = skill.type === 'OFFER' ? 'bg-blue-500' : 'bg-green-500';

  return (
    <Link 
      to={`/skills/${skill._id}`} 
      className="flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className={`h-2 ${typeColor}`}></div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full">{skill.category}</span>
          {isAuthenticated && !isOwner && (
            <button onClick={handleBookmarkClick} className="text-gray-400 hover:text-yellow-400" aria-label="Bookmark skill">
              <BookmarkIcon className={`h-6 w-6 ${isBookmarked ? 'text-accent-500 fill-current' : 'text-slate-400'}`} />
            </button>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{skill.title}</h3>
        
        <p className="text-gray-600 dark:text-gray-400 my-4 flex-grow h-12 overflow-hidden">
          {skill.description?.substring(0, 100)}{skill.description?.length > 100 && '...'}
        </p>

        <div className="border-t dark:border-slate-700 my-4"></div>

        <div className="grid grid-cols-3 gap-2 text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex flex-col items-center justify-center">
            <span className="font-bold text-lg text-amber-500">
              {skill.type === 'OFFER' ? skill.costInCredits : skill.creditsOffered}
            </span>
            <span className="text-xs">Credits</span>
          </div>
          <div className="flex flex-col items-center justify-center">
             <span className="font-bold text-lg text-slate-700 dark:text-slate-200">{skill.level}</span>
             <span className="text-xs">Level</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="font-bold text-lg text-yellow-400 flex items-center justify-center">
              <StarIcon className="h-4 w-4 mr-1"/>
              {parseFloat(skill.averageRating.toFixed(1)) || 0}
            </span>
            <span className="text-xs">({skill.ratings?.length || 0} Ratings)</span>
          </div>
        </div>
        
        {!hideUser && skill.user && (
          <div className="flex items-center text-xs text-slate-500 mt-auto">
            <img src={skill.user.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${skill.user.username}`} alt={skill.user.username} className="h-6 w-6 rounded-full mr-2"/>
            <span>Posted by: {skill.user.username}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default SkillCard;