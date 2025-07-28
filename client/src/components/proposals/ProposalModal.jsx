import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const ProposalModal = ({ isOpen, onClose, requestedSkill }) => {
  const { user } = useAuth();
  const [proposalType, setProposalType] = useState('credits'); // 'credits' or 'skill'
  const [myOfferedSkills, setMyOfferedSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    // Only fetch the user's skills if they select the "Offer a Skill" option
    if (isOpen && proposalType === 'skill' && user?._id) {
      setLoadingSkills(true);
      apiClient.get(`/skills?type=OFFER&userId=${user._id}`)
        .then(res => setMyOfferedSkills(res.data.data.skills))
        .catch(() => setError("Could not fetch your skills."))
        .finally(() => setLoadingSkills(false));
    }
  }, [isOpen, proposalType, user?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const proposalData = {
      requestedSkillId: requestedSkill._id,
      proposalType,
      offeredSkillId: proposalType === 'skill' ? selectedSkillId : undefined,
    };

    if (proposalType === 'skill' && !selectedSkillId) {
      return setError("Please select a skill to offer.");
    }

    try {
      await apiClient.post('/proposals', proposalData);
      setSuccess('Proposal sent successfully!');
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send proposal.');
    }
  };

  if (!isOpen) return null;

  const canAfford = user.swapCredits >= requestedSkill.costInCredits;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Propose a Swap</h2>
        <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-md mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">You are requesting:</p>
          <h3 className="font-semibold text-lg">{requestedSkill.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">from {requestedSkill.user.username}</p>
        </div>
        
        <div className="flex justify-center gap-2 mb-4 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
          <button onClick={() => setProposalType('credits')} className={`w-full py-2 rounded-md font-semibold ${proposalType === 'credits' ? 'bg-white dark:bg-slate-900 shadow' : ''}`}>Pay with Credits</button>
          <button onClick={() => setProposalType('skill')} className={`w-full py-2 rounded-md font-semibold ${proposalType === 'skill' ? 'bg-white dark:bg-slate-900 shadow' : ''}`}>Offer a Skill</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {proposalType === 'credits' && (
            <div className="text-center p-4 border-2 border-dashed rounded-md">
              <p className="text-slate-500">This skill costs:</p>
              <p className="text-3xl font-bold my-2 text-amber-500">{requestedSkill.costInCredits} Credits</p>
              <p className={`text-sm ${canAfford ? 'text-slate-500' : 'text-red-500'}`}>Your balance: {user.swapCredits} Credits</p>
            </div>
          )}
          {proposalType === 'skill' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select a skill to offer:</label>
              {loadingSkills ? (
                <p>Loading your skills...</p>
              ) : myOfferedSkills.length > 0 ? (
                <select value={selectedSkillId} onChange={(e) => setSelectedSkillId(e.target.value)} required className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md">
                  <option value="" className="bg-white dark:bg-slate-700">-- Select one of your skills --</option>
                  {myOfferedSkills.map(skill => <option key={skill._id} value={skill._id} className="bg-white dark:bg-slate-700">{skill.title}</option>)}
                </select>
              ) : (
                <div className="text-center p-4 border-2 border-dashed rounded-md">
                    <p className="text-sm text-slate-500 mb-2">You have no skills to offer.</p>
                    <Link to="/skills/new" onClick={onClose} className="text-accent-500 font-semibold hover:underline">Click here to add one!</Link>
                </div>
              )}
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm text-center my-4">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center my-4">{success}</p>}

          <div className="flex justify-end space-x-4 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300">Cancel</button>
            <button type="submit" disabled={(!canAfford && proposalType === 'credits') || !!success} className="px-4 py-2 rounded-md font-semibold text-white bg-accent-600 hover:bg-accent-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
              {success ? 'Sent!' : 'Send Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalModal;