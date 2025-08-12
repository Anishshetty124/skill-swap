import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import ProposalCard from '../components/dashboard/ProposalCard';
import ProposalCardSkeleton from '../components/dashboard/ProposalCardSkeleton';
import { useSocketContext } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';

const ProposalList = ({ proposals, type, onUpdate, onDelete }) => {
  if (proposals.length === 0) {
    return <p className="text-slate-500 italic mt-4">No {type} proposals found.</p>;
  }
  return (
    <div className="space-y-4">
      {proposals.map(p => (
        <ProposalCard
          key={p._id}
          proposal={p}
          type={type}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('received');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get(`/proposals?type=${activeTab}`);
      const validProposals = response.data.data
        .filter(p => p.requestedSkill)
        .filter(p => !p.archivedBy?.includes(user?._id));
      setProposals(validProposals);
    } catch (err) {
      console.error("Failed to fetch proposals", err);
      setError(`Failed to fetch ${activeTab} proposals.`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, proposals.length, user?._id]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals, location.state]);

  useEffect(() => {
    const handleUpdate = () => fetchProposals();
    socket?.on('swap_completed', handleUpdate);
    socket?.on('new_notification', handleUpdate);
    return () => {
      socket?.off('swap_completed', handleUpdate);
      socket?.off('new_notification', handleUpdate);
    };
  }, [socket, fetchProposals]);

  const handleProposalUpdate = (updatedProposal) => {
    setProposals(prev =>
      prev.map(p => (p._id === updatedProposal._id ? updatedProposal : p))
    );
  };

  const handleProposalDelete = (deletedProposalId) => {
    setProposals(prev => prev.filter(p => p._id !== deletedProposalId));
  };

  const tabClass = (tabName) =>
    `px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 ${
      activeTab === tabName
        ? 'bg-accent-600 text-white'
        : 'bg-gray-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
    }`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>

      {/* Tabs */}
      <div className="mb-6 flex space-x-2">
        <button
          onClick={() => setActiveTab('received')}
          className={tabClass('received')}
        >
          Received Proposals
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={tabClass('sent')}
        >
          Sent Proposals
        </button>
      </div>

      {/* Content */}
      <div className="p-6 bg-gray-100 dark:bg-slate-800 rounded-b-md rounded-r-md">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <ProposalCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <ProposalList
            proposals={proposals}
            type={activeTab}
            onUpdate={handleProposalUpdate}
            onDelete={handleProposalDelete}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
