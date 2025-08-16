import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';
import apiClient from '../../api/axios';
import Spinner from '../common/Spinner';

const EditTeamModal = ({ isOpen, onClose, team, onSuccess }) => {
    const [teamName, setTeamName] = useState('');
    const [maxMembers, setMaxMembers] = useState(10);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (team) {
            setTeamName(team.teamName);
            setMaxMembers(team.maxMembers);
        }
    }, [team]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (maxMembers < team.members.length + 1) {
            toast.error(`Max members cannot be less than the current number of members (${team.members.length + 1}).`);
            return;
        }
        setSubmitting(true);
        try {
            await apiClient.patch(`/teams/${team._id}/details`, { teamName, maxMembers });
            toast.success("Team details updated successfully!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update team details.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Edit Team Details</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="teamName" className="block text-sm font-medium mb-1">Team Name</label>
                            <input
                                id="teamName"
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="maxMembers" className="block text-sm font-medium mb-1">Max Members</label>
                            <input
                                id="maxMembers"
                                type="number"
                                value={maxMembers}
                                // --- THIS IS THE FIX ---
                                onChange={(e) => setMaxMembers(parseInt(e.target.value, 10) || 0)}
                                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md"
                                min="2"
                                max="50"
                                required
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? <Spinner isButtonSpinner={true} /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTeamModal;
