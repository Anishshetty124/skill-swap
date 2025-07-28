import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProposalModal from '../components/proposals/ProposalModal';
import SkillCard from '../components/skills/SkillCard';
import toast from 'react-hot-toast';

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(<span key={i} className={i <= rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>);
  }
  return <div className="flex">{stars}</div>;
};

const StarRatingInput = ({ currentRating, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" className={`text-3xl transition-colors ${star <= (hoverRating || currentRating) ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => onRate(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}>★</button>
      ))}
    </div>
  );
};

const SingleSkillPage = () => {
  const { skillId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    const fetchSkillAndMatches = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/skills/${skillId}`);
        const fetchedSkill = response.data.data;
        setSkill(fetchedSkill);

        if (fetchedSkill.ratings && fetchedSkill.ratings.length > 0) {
          const total = fetchedSkill.ratings.reduce((acc, r) => acc + r.rating, 0);
          setAvgRating(total / fetchedSkill.ratings.length);
          const myRating = fetchedSkill.ratings.find(r => r.user?._id === user?._id);
          if (myRating) setUserRating(myRating.rating);
        } else {
          setAvgRating(0);
          setUserRating(0);
        }

        if (user?._id === fetchedSkill.user._id && fetchedSkill.type === 'REQUEST') {
          const matchesResponse = await apiClient.get(`/skills/${skillId}/matches`);
          setMatches(matchesResponse.data.data);
        }
      } catch (err) {
        setError('Failed to load skill details or skill not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchSkillAndMatches();
  }, [skillId, user?._id]);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      setDeleting(true);
      try {
        await apiClient.delete(`/skills/${skillId}`);
        toast.success('Skill deleted successfully!');
        // Navigate to dashboard and pass a state to indicate a refresh is needed
        navigate('/dashboard', { state: { refresh: true } });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete skill.');
        setDeleting(false);
      }
    }
  };
  
  const handleRateSkill = async (rating) => {
    if (!isAuthenticated) {
        toast.error("You must be logged in to rate a skill.");
        return;
    }
    try {
      await apiClient.post(`/skills/${skillId}/rate`, { rating });
      const response = await apiClient.get(`/skills/${skillId}`);
      const updatedSkill = response.data.data;
      setSkill(updatedSkill);

      if (updatedSkill.ratings && updatedSkill.ratings.length > 0) {
        const total = updatedSkill.ratings.reduce((acc, r) => acc + r.rating, 0);
        setAvgRating(total / updatedSkill.ratings.length);
        const myRating = updatedSkill.ratings.find(r => r.user?._id === user?._id);
        if (myRating) setUserRating(myRating.rating);
      }
      toast.success("Your rating has been submitted!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit rating.");
    }
  };

  const isOwner = isAuthenticated && user?._id === skill?.user?._id;
  const canPropose = isAuthenticated && !isOwner;

  if (loading) return <p className="text-center p-10">Loading...</p>;
  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;
  if (!skill) return <p className="text-center p-10">Skill not found.</p>;

  const skillTypeColor = skill.type === 'OFFER' ? 'text-blue-500' : 'text-green-500';

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{skill.title}</h1>
          <span className={`text-lg font-bold ${skillTypeColor}`}>{skill.type}</span>
        </div>
        
        <div className="flex items-center mb-6">
          <span className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full mr-4">{skill.category}</span>
          <Link to={`/profile/${skill.user.username}`} className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
            Posted by: <span className="font-medium text-indigo-600 dark:text-indigo-400">{skill.user.username}</span>
          </Link>
        </div>

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{skill.description}</p>

        <div className="mt-8 border-t dark:border-gray-700 pt-6">
          <h3 className="text-xl font-semibold mb-4">Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
            <p><strong>Level:</strong> {skill.level}</p>
              <p className="md:col-span-2"><strong>Seeking in Return:</strong> {skill.desiredSkill || 'Open to offers'}</p>
            <p><strong>Location:</strong> {skill.locationString}</p> 

          </div>
        </div>

        <div className="mt-8 border-t dark:border-gray-700 pt-6">
          <h3 className="text-xl font-semibold mb-2">Skill Rating</h3>
          <div className="flex items-center gap-4 mb-4">
            <p className="font-bold text-lg">{avgRating.toFixed(1)} / 5</p>
            <p className="text-sm text-gray-500">({skill?.ratings?.length || 0} ratings)</p>
          </div>
          
          {isAuthenticated && !isOwner && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Your Rating:</p>
              <StarRatingInput currentRating={userRating} onRate={handleRateSkill} />
            </div>
          )}

          {skill.ratings && skill.ratings.length > 0 && (
            <div className="space-y-2 mt-4">
              {skill.ratings.map(r => (
                <div key={r._id || r.user._id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{r.user?.username || 'A user'}</span>
                  <StarRating rating={r.rating} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-8 flex justify-center items-center gap-4">
          {canPropose && (<button onClick={() => setIsModalOpen(true)} className="px-8 py-3 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Propose a Swap</button>)}
          {isOwner && (<button onClick={handleDelete} disabled={deleting} className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400">{deleting ? 'Deleting...' : 'Delete Skill'}</button>)}
          {!isAuthenticated && !isOwner && (<p className="text-sm text-gray-500 italic">Please log in to propose a swap.</p>)}
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Top Matches For Your Request</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(matchSkill => <SkillCard key={matchSkill._id} skill={matchSkill} />)}
          </div>
        </div>
      )}

      <ProposalModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} requestedSkill={skill}/>
    </div>
  );
};

export default SingleSkillPage;