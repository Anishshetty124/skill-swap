import React, { useState, useEffect } from 'react';
import ProposalList from '../components/dashboard/ProposalList';
import apiClient from '../api/axios';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await apiClient.get(`/proposals?type=${activeTab}`);
        setProposals(response.data.data);
      } catch (err) {
        setError(`Failed to fetch ${activeTab} proposals.`);
      } finally {
        setLoading(false);
      }
    };
    fetchProposals();
  }, [activeTab]);

  const handleProposalUpdate = (updatedProposal) => {
    setProposals(prevProposals => 
      prevProposals.map(p => p._id === updatedProposal._id ? updatedProposal : p)
    );
  };

  const tabClass = (tabName) => 
    `px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 ${activeTab === tabName 
      ? 'bg-indigo-600 text-white' 
      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      <div className="mb-6 flex space-x-2">
        <button onClick={() => setActiveTab('received')} className={tabClass('received')}>
          Received Proposals
        </button>
        <button onClick={() => setActiveTab('sent')} className={tabClass('sent')}>
          Sent Proposals
        </button>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-b-md rounded-r-md">
        {loading ? (
          <p className="text-center">Loading proposals...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <ProposalList 
            proposals={proposals} 
            type={activeTab} 
            onUpdate={handleProposalUpdate} 
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;