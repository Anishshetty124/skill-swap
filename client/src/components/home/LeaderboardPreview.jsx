import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { Link } from 'react-router-dom';

const LeaderboardPreview = () => {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const response = await apiClient.get('/users/leaderboard');
        setTopUsers(response.data.data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch top users for preview.");
      } finally {
        setLoading(false);
      }
    };
    fetchTopUsers();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (topUsers.length === 0) return null;

  return (
    <div className="space-y-4">
      {topUsers.map((user, index) => (
        <Link to={`/profile/${user.username}`} key={user._id} className="p-4 flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-slate-400 w-8 text-center">{index + 1}</span>
            <img 
              src={user.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${user.firstName} ${user.lastName}`} 
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-slate-500">@{user.username}</p>
            </div>
          </div>
          <p className="font-bold text-lg text-amber-500">{user.score} pts</p>
        </Link>
      ))}
      <div className="text-center">
        <Link to="" className="font-semibold text-accent-500 hover:underline">
          View Full Leaderboard →
        </Link>
      </div>
    </div>
  );
};

export default LeaderboardPreview;
