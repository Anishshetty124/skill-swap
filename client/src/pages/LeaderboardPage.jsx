import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { Link } from 'react-router-dom';
import Spinner from '../components/common/Spinner';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/users/leaderboard');
        setLeaderboard(response.data.data);
      } catch (err) {
        setError('Failed to load the leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <Spinner text="Loading leaderboard..." />;
  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Top Skill Swappers</h1>
        <p className="text-slate-500 mt-2">See who's leading the community in skills and credits!</p>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {leaderboard.map((user, index) => (
            <li key={user._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-slate-400 w-8 text-center">{index + 1}</span>
              <Link to={`/profile/${user.username}`} className="flex items-center gap-4">
                   {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white flex items-center justify-center font-bold text-xl">
                      {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-slate-500">@{user.username}</p>
                  </div>
                </Link>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-amber-500">{user.score} pts</p>
                <p className="text-xs text-slate-500">{user.swapsCompleted} swaps</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LeaderboardPage;
