import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/axios';

const ProposalModal = ({ isOpen, onClose, requestedSkill }) => {
  const { user } = useAuth();
  const [myOfferedSkills, setMyOfferedSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    // Only fetch skills if the modal is open and we have a user
    if (isOpen && user?._id) {
      const fetchMySkills = async () => {
        setLoadingSkills(true);
        setError('');
        try {
          const response = await apiClient.get(`/skills?type=OFFER&userId=${user._id}`);
          setMyOfferedSkills(response.data.data.skills);
        } catch (err) {
          setError("Could not fetch your skills to offer.");
        } finally {
          setLoadingSkills(false);
        }
      };
      fetchMySkills();
    } else {
      // Reset state when modal is closed
      setMyOfferedSkills([]);
      setSelectedSkillId('');
      setMessage('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, user?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSkillId) {
      setError('You must select one of your skills to offer.');
      return;
    }

    const proposalData = {
      requestedSkillId: requestedSkill._id,
      offeredSkillId: selectedSkillId,
      message: message,
    };

    try {
      await apiClient.post('/proposals', proposalData);
      setSuccess('Proposal sent successfully!');
      setTimeout(() => {
        onClose(); // Close the modal
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send proposal.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4">Propose a Swap</h2>
        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">You are requesting:</p>
          <h3 className="font-semibold text-lg">{requestedSkill.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">from {requestedSkill.user.username}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">In exchange for your skill:</label>
            {loadingSkills ? (
              <p>Loading your skills...</p>
            ) : (
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                required
                className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md"
              >
                <option value="">-- Select one of your skills --</option>
                {myOfferedSkills.length > 0 ? (
                  myOfferedSkills.map(skill => (
                    <option key={skill._id} value={skill._id}>{skill.title}</option>
                  ))
                ) : (
                  <option disabled>You have no skills to offer.</option>
                )}
              </select>
            )}
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Message (Optional):</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="3"
              placeholder="Write a short message..."
              className="w-full px-3 py-2 text-gray-800 border border-gray-300 rounded-md"
            ></textarea>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center mb-4">{success}</p>}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300" disabled={success}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700" disabled={success || loadingSkills}>
              {success ? 'Sent!' : 'Send Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalModal;