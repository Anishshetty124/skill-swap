import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import ProposalList from '../components/dashboard/ProposalList';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('received');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    if(user) {
        const fetchProposals = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await apiClient.get(`/proposals?type=${activeTab}`);
            const validProposals = response.data.data.filter(p => p.requestedSkill);
            setProposals(validProposals);
        } catch (err) {
            setError(`Failed to fetch ${activeTab} proposals.`);
        } finally {
            setLoading(false);
        }
        };
        fetchProposals();
    }
  }, [user, activeTab, location.state]);

  const handleProposalUpdate = (updatedProposal) => {
    setProposals(prevProposals =>
      prevProposals.map(p => p._id === updatedProposal._id ? updatedProposal : p)
    );
  };
  
  const handleProposalDelete = (deletedProposalId) => {
    setProposals(prevProposals =>
      prevProposals.filter(p => p._id !== deletedProposalId)
    );
  };

  const tabClass = (tabName) => 
    `px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 ${activeTab === tabName 
      ? 'bg-accent-600 text-white' 
      : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      <div className="mb-6 flex space-x-2">
        <button onClick={() => setActiveTab('received')} className={tabClass('received')}>
          Received Proposals
        </button>
        <button onClick={() => setActiveTab('sent')} className={tabClass('sent')}>
          Sent Proposals
        </button>
      </div>

      <div className="p-6 bg-white dark:bg-slate-800 rounded-b-md rounded-r-md">
        {loading ? (
          <p className="text-center">Loading proposals...</p>
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
