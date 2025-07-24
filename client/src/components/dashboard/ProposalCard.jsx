import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../api/axios';
import toast from 'react-hot-toast';

const ProposalCard = ({ proposal, type, onUpdate }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResponse = async (status) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.patch(`/proposals/${proposal._id}/respond`, { status });
      onUpdate(response.data.data);
      toast.success(`Proposal ${status}.`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} proposal.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const actionText = proposal.status === 'pending' && type === 'sent' ? 'withdraw' : 'delete';
    if (window.confirm(`Are you sure you want to ${actionText} this proposal?`)) {
      setLoading(true);
      setError('');
      try {
        await apiClient.delete(`/proposals/${proposal._id}`);
        toast.success(`Proposal ${actionText} successfully!`);
        navigate('/'); // Redirect to the home page
      } catch (err) {
        setError(err.response?.data?.message || `Failed to ${actionText} proposal.`);
        setLoading(false);
      }
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  const offeredSkillTitle = proposal.offeredSkill?.title || '[Deleted Skill]';
  const requestedSkillTitle = proposal.requestedSkill?.title || '[Deleted Skill]';

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-indigo-500">
      <div className="flex justify-between items-center mb-3">
        <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${statusColors[proposal.status]}`}>
          {proposal.status}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(proposal.createdAt).toLocaleDateString()}
        </span>
      </div>

      {type === 'received' ? (
        <p className="text-gray-700 dark:text-gray-300">
          <span className="font-bold">{proposal.proposer.username}</span> wants to trade their{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">{offeredSkillTitle}</span> for your{' '}
          <span className="font-semibold text-green-600 dark:text-green-400">{requestedSkillTitle}</span>.
        </p>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">
          You offered your{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">{offeredSkillTitle}</span> for{' '}
          <span className="font-bold">{proposal.receiver.username}</span>'s{' '}
          <span className="font-semibold text-green-600 dark:text-green-400">{requestedSkillTitle}</span>.
        </p>
      )}

      {proposal.message && (
        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-sm italic text-gray-600 dark:text-gray-400">"{proposal.message}"</p>
        </div>
      )}

      <div className="flex justify-end items-center space-x-3 mt-4">
        {loading && <span className="text-sm italic">Processing...</span>}
        {!loading && (
          <>
            {type === 'received' && proposal.status === 'pending' && (
              <>
                <button onClick={() => handleResponse('rejected')} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
                <button onClick={() => handleResponse('accepted')} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Accept</button>
              </>
            )}
            <button onClick={handleDelete} className="text-gray-400 hover:text-red-500" title="Delete Proposal">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </button>
          </>
        )}
      </div>
      {error && !loading && <p className="text-red-500 text-xs mt-2 text-right">{error}</p>}
    </div>
  );
};

export default ProposalCard;