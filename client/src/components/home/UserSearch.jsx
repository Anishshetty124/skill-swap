import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/axios'; // Make sure this path is correct
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/solid';

const UserSearch = () => {
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchRef = useRef(null);

  // Effect for live searching/recommendations
  useEffect(() => {
    if (userSearchQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }
    const debounceTimer = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const response = await apiClient.get(`/users/search?query=${userSearchQuery}`);
        setUserResults(response.data.data);
      } catch (error) {
        console.error("Failed to fetch user suggestions", error);
      } finally {
        setUserSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery]);

  // Effect to close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target)) {
        setUserResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!userSearchQuery.trim()) return;
    setUserResults([]);
    setUserSearchLoading(true);
    try {
      const response = await apiClient.get(`/users/search?query=${userSearchQuery}`);
      setUserResults(response.data.data);
    } catch (error) {
      console.error("Failed to search for users", error);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const handleClearUserSearch = () => {
    setUserSearchQuery('');
    setUserResults([]);
    setShowUserSearch(false);
  };

  return (
    <div ref={userSearchRef} className="mb-8 px-4 py-6 w-full md:w-[80%] mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-lg transition-colors duration-300">
      {!showUserSearch ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-evenly gap-4 text-center md:text-left">
          <h2 className="text-xl font-bold">
            Want to find a specific member of the community?
          </h2>
          <button
            onClick={() => setShowUserSearch(true)}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
          >
            Search for a User
          </button>
        </div>
      ) : (
        <form onSubmit={handleUserSearch} className="relative">
          <label className="block text-sm font-medium mb-1">
            Search by Name or Username
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Enter a name or username..."
              className="flex-grow px-4 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"
              autoComplete="off"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Search
            </button>
            {userSearchQuery && (
              <button
                type="button"
                onClick={handleClearUserSearch}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
              >
                Clear
              </button>
            )}
          </div>
          {(userSearchLoading || userResults.length > 0) && (
            <div className="absolute z-20 top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700 max-h-60 overflow-y-auto">
              {userSearchLoading ? (
                <p className="p-4 text-center text-slate-500">Searching...</p>
              ) : (
                userResults.map(user => (
                  <Link
                    key={user._id}
                    to={`/profile/${user.username}`}
                    onClick={handleClearUserSearch}
                    className="p-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 border-b dark:border-slate-700/50"
                  >
                    <img src={user.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${user.firstName} ${user.lastName}`} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-slate-500">@{user.username}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default UserSearch;