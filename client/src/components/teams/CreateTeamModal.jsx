import React, { useState } from 'react';
import apiClient from '../../api/axios';
import { toast } from 'react-toastify';
import { XMarkIcon } from '@heroicons/react/24/solid';

const CreateTeamModal = ({ isOpen, onClose, skill, onCreated }) => {
  const [teamName, setTeamName] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/teams', {
        skillId: skill._id,
        teamName: teamName || `${skill.title} Team`,
        maxMembers,
      });
      toast.success("Team created successfully!");
      onTeamCreated(response.data.data);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create team.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">Create a Team for "{skill.title}"</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium mb-1">Team Name (Optional)</label>
              <input
                id="teamName"
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder={`${skill.title} Team`}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="maxMembers" className="block text-sm font-medium mb-1">Max Members</label>
              <input
                id="maxMembers"
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value, 10))}
                min="2"
                max="50"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md"
              />
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
