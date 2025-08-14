import React, { useState, useEffect, useCallback } from 'react';
import { TrophyIcon, FlagIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios';
import TeamCard from '../components/explore/TeamCard';
import Spinner from '../components/common/Spinner';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const ExplorePage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/teams');
      setTeams(response.data.data);
    } catch (error) {
      console.error("Failed to fetch teams", error);
      toast.error("Could not load teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleJoinTeam = async (teamId) => {
    if (!isAuthenticated) {
        toast.info("Please log in to join a team.");
        return;
    }
    try {
      const response = await apiClient.post(`/teams/${teamId}/join`);
      // After joining, re-fetch the teams to get the latest member counts and statuses
      fetchTeams(); 
      toast.success("Successfully joined the team!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join team.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-center mb-4">Explore SkillSwap</h1>
      <p className="text-center text-slate-500 mb-12">Discover new ways to connect, learn, and grow with the community.</p>


{/* Quick Links Section */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
  {/* Leaderboard */}
  <Link
    to="/leaderboard"
    className="cursor-pointer group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 text-white p-8 flex flex-col items-center justify-center"
  >
    <div className="bg-white/30 rounded-full p-5 mb-4 group-hover:scale-110 transition-transform duration-300">
      <TrophyIcon className="h-14 w-14" />
    </div>
    <h3 className="text-2xl font-bold mb-2">Leaderboard</h3>
    <p className="text-sm opacity-90">See who's leading the community.</p>
  </Link>

  {/* Lucky Spin */}
  <Link
    to="/lucky-roll"
    className="cursor-pointer group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 text-white p-8 flex flex-col items-center justify-center"
  >
    <div className="bg-white/30 rounded-full p-5 mb-4 group-hover:rotate-90 group-hover:scale-110 transition-transform duration-500">
      {/* Multi-color spin wheel */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="h-14 w-14">
        <circle cx="32" cy="32" r="30" fill="white" stroke="currentColor" strokeWidth="2" />
        <path d="M32 2 A30 30 0 0 1 62 32 L32 32 Z" fill="#f87171" />
        <path d="M62 32 A30 30 0 0 1 32 62 L32 32 Z" fill="#fbbf24" />
        <path d="M32 62 A30 30 0 0 1 2 32 L32 32 Z" fill="#34d399" />
        <path d="M2 32 A30 30 0 0 1 32 2 L32 32 Z" fill="#60a5fa" />
        <circle cx="32" cy="32" r="5" fill="black" />
      </svg>
    </div>
    <h3 className="text-2xl font-bold mb-2">Lucky Spin</h3>
    <p className="text-sm opacity-90">Spin the wheel for daily rewards.</p>
  </Link>

  {/* Contests */}
  <div className="cursor-pointer group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white p-8 flex flex-col items-center justify-center">
    <div className="bg-white/30 rounded-full p-5 mb-4 group-hover:scale-110 transition-transform duration-300">
      <FlagIcon className="h-14 w-14" />
    </div>
    <h3 className="text-2xl font-bold mb-2">Contests</h3>
    <p className="text-sm opacity-90">Coming Soon</p>
  </div>
</div>


      {/* Teams Section */}
      <div>
        <h2 className="text-3xl font-bold mb-6">Join a Team</h2>
        {loading ? (
          <Spinner text="Loading teams..." />
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <TeamCard key={team._id} team={team} onJoin={handleJoinTeam} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-10">No open teams available right now. Check back soon!</p>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
