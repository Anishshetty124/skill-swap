import React, { useState } from 'react';
import apiClient from '../../api/axios';

const ProposalCard = ({ proposal, type, onUpdate }) => {
  const [error, setError] = useState('');

  const handleResponse = async (status) => {
    setError('');
    try {
      const response = await apiClient.patch(`/proposals/${proposal._id}/respond`, { status });
      onUpdate(response.data.data); // Notify parent component of the update
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status} proposal.`);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500',
    accepted: 'bg-green-500',
    rejected: 'bg-red-500',
  };

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
          <span className="font-semibold text-blue-600 dark:text-blue-400">{proposal.offeredSkill.title}</span> for your{' '}
          <span className="font-semibold text-green-600 dark:text-green-400">{proposal.requestedSkill.title}</span>.
        </p>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">
          You offered your{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">{proposal.offeredSkill.title}</span> for{' '}
          <span className="font-bold">{proposal.receiver.username}</span>'s{' '}
          <span className="font-semibold text-green-600 dark:text-green-400">{proposal.requestedSkill.title}</span>.
        </p>
      )}

      {proposal.message && (
        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p className="text-sm italic text-gray-600 dark:text-gray-400">"{proposal.message}"</p>
        </div>
      )}

      {type === 'received' && proposal.status === 'pending' && (
        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={() => handleResponse('rejected')} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
          <button onClick={() => handleResponse('accepted')} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Accept</button>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-2 text-right">{error}</p>}
    </div>
  );
};

export default ProposalCard;