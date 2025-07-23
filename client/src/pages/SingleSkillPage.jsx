import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProposalModal from '../components/proposals/ProposalModal';
import SkillCard from '../components/skills/SkillCard';

const SingleSkillPage = () => {
  const { skillId } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [skill, setSkill] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSkillAndMatches = async () => {
      try {
        setLoading(true);
        setMatches([]); // Reset matches on new skill load
        setError('');

        const response = await apiClient.get(`/skills/${skillId}`);
        const fetchedSkill = response.data.data;
        setSkill(fetchedSkill);

        // If the logged-in user is viewing their OWN skill REQUEST, fetch matches
        if (user?._id === fetchedSkill.user._id && fetchedSkill.type === 'REQUEST') {
          const matchesResponse = await apiClient.get(`/skills/${skillId}/matches`);
          setMatches(matchesResponse.data.data);
        }
      } catch (err) {
        setError('Failed to load skill details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillAndMatches();
  }, [skillId, user?._id]); // Re-fetch if skillId or logged-in user changes

  const canPropose = isAuthenticated && user?._id !== skill?.user?._id;

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!skill) {
    return <div className="text-center p-10">Skill not found.</div>;
  }

  const skillTypeColor = skill.type === 'OFFER' ? 'text-blue-500' : 'text-green-500';

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{skill.title}</h1>
          <span className={`text-lg font-bold ${skillTypeColor}`}>{skill.type}</span>
        </div>
        
        <div className="flex items-center mb-6">
          <span className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full mr-4">
            {skill.category}
          </span>
          <Link to={`/profile/${skill.user.username}`} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Posted by: <span className="font-medium text-indigo-600 dark:text-indigo-400">{skill.user.username}</span>
          </Link>
        </div>

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {skill.description}
        </p>

        <div className="mt-8 border-t dark:border-gray-700 pt-6">
          <h3 className="text-xl font-semibold mb-4">Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
            <p><strong>Level:</strong> {skill.level}</p>
            <p><strong>Availability:</strong> {skill.availability}</p>
            <p><strong>Location:</strong> {skill.location}</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          {canPropose ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto px-8 py-3 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Propose a Swap
            </button>
          ) : (
            <p className="text-sm text-gray-500 italic">
              {isAuthenticated ? "This is your own skill." : "Please log in to propose a swap."}
            </p>
          )}
        </div>
      </div>

      {/* Recommended Matches Section */}
      {matches.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12">
          <h2 className="text-2xl font-bold mb-4">Top Matches For Your Request</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(matchSkill => <SkillCard key={matchSkill._id} skill={matchSkill} />)}
          </div>
        </div>
      )}

      {/* Proposal Modal */}
      <ProposalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestedSkill={skill}
      />
    </>
  );
};

export default SingleSkillPage;