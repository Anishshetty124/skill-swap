import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import apiClient from '../../api/axios';

const TeamCard = ({ team, onJoin }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMember = team.members.includes(user?._id);
  const isInstructor = team.instructor._id === user?._id;
  const isFull = team.members.length >= team.maxMembers;

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to join a team.");
      return;
    }
    onJoin(team._id);
  };

  const renderButton = () => {
    if (isMember || isInstructor) {
      return (
        <button
          onClick={() => navigate(`/team/${team._id}`)}
          className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          View Team
        </button>
      );
    }
    if (isFull) {
        return <button className="px-4 py-2 text-sm font-semibold text-white bg-slate-400 rounded-md cursor-not-allowed" disabled>Full</button>;
    }
    return <button onClick={handleJoin} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Join Team</button>;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 flex flex-col h-full">
      <div className="flex-grow">
        <p className="text-sm text-blue-500 font-semibold">{team.skill.category}</p>
        <h3 className="text-xl font-bold mt-1">{team.skill.title}</h3>
        <div className="flex items-center gap-3 mt-4">
          <img 
            src={team.instructor.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${team.instructor.firstName} ${team.instructor.lastName}`} 
            alt={team.instructor.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm text-slate-500">Taught by</p>
            <p className="font-semibold">{team.instructor.firstName} {team.instructor.lastName}</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-between items-center">
        <p className="font-bold text-lg">
          {team.members.length} / {team.maxMembers}
          <span className="font-normal text-sm text-slate-500 ml-1">members</span>
        </p>
        {renderButton()}
      </div>
    </div>
  );
};

export default TeamCard;
