import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SkillCard from '../components/skills/SkillCard';
import { StarIcon, MapPinIcon, FlagIcon } from '@heroicons/react/24/solid';
import Spinner from '../components/common/Spinner';
import ProposalModal from '../components/proposals/ProposalModal';
import { toast } from 'react-toastify';

const StarRating = ({ rating }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <StarIcon
        key={i}
        className={`h-5 w-5 ${
          i <= rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    );
  }
  return <div className="flex">{stars}</div>;
};

const StarRatingInput = ({ currentRating, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <StarIcon
            className={`h-8 w-8 transition-colors ${
              star <= (hoverRating || currentRating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
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

  // --- Reporting state ---
  const [isReported, setIsReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const fetchSkillAndMatches = async () => {
      try {
        setLoading(true);
        setError('');

        if (!isAuthenticated) {
          setError('Please login to view this skill.');
          return;
        }

        const response = await apiClient.get(`/skills/${skillId}`);
        const fetchedSkill = response.data?.data;
        if (!fetchedSkill) {
          setError('Skill not found.');
          return;
        }
        setSkill(fetchedSkill);

        // Check if already reported
        if (
          isAuthenticated &&
          user &&
          fetchedSkill.reportedBy?.includes(user._id)
        ) {
          setIsReported(true);
        }

        // Ratings logic
        const ratingsArr = fetchedSkill.ratings || [];
        if (ratingsArr.length > 0) {
          const total = ratingsArr.reduce(
            (acc, r) => acc + (r?.rating || 0),
            0
          );
          const avg = total / ratingsArr.length;
          setAvgRating(Number.isFinite(avg) ? avg : 0);
          const myRating = ratingsArr.find(
            (r) => r?.user?._id === user?._id
          );
          setUserRating(myRating ? myRating.rating : 0);
        } else {
          setAvgRating(0);
          setUserRating(0);
        }

        // Matches logic
        if (
          user?._id === fetchedSkill?.user?._id &&
          fetchedSkill.type === 'REQUEST'
        ) {
          const matchesResponse = await apiClient.get(
            `/skills/${skillId}/matches`
          );
          const fetchedMatches = matchesResponse.data?.data || [];
          setMatches((fetchedMatches || []).filter(Boolean));
        } else {
          setMatches([]);
        }
      } catch (err) {
        setError('Failed to load skill details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSkillAndMatches();
  }, [skillId, user?._id, isAuthenticated]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      setDeleting(true);
      try {
        await apiClient.delete(`/skills/${skillId}`);
        toast.success('Skill deleted successfully!');
        navigate('/my-skills', { state: { refresh: true } });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete skill.');
        setDeleting(false);
      }
    }
  };

  const handleRateSkill = async (rating) => {
    if (!isAuthenticated) {
      toast.error('You must be logged in to rate a skill.');
      return;
    }
    try {
      await apiClient.post(`/skills/${skillId}/rate`, { rating });
      const response = await apiClient.get(`/skills/${skillId}`);
      const updatedSkill = response.data?.data;
      setSkill(updatedSkill);

      const ratingsArr = updatedSkill?.ratings || [];
      if (ratingsArr.length > 0) {
        const total = ratingsArr.reduce(
          (acc, r) => acc + (r?.rating || 0),
          0
        );
        const avg = total / ratingsArr.length;
        setAvgRating(Number.isFinite(avg) ? avg : 0);
        const myRating = ratingsArr.find(
          (r) => r?.user?._id === user?._id
        );
        setUserRating(myRating ? myRating.rating : 0);
      } else {
        setAvgRating(0);
        setUserRating(0);
      }
      toast.success('Your rating has been submitted!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating.');
    }
  };

  const handleReportSkill = async () => {
    if (
      !window.confirm(
        'Are you sure you want to report this skill for inappropriate content?'
      )
    ) {
      return;
    }
    setReporting(true);
    try {
      await apiClient.post(`/skills/${skillId}/report`);
      toast.success('Skill reported. Our team will review it shortly.');
      setIsReported(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report skill.');
    } finally {
      setReporting(false);
    }
  };

  const isOwner = isAuthenticated && user?._id === skill?.user?._id;
  const canPropose = isAuthenticated && !isOwner;
  const safeAvg = Number.isFinite(avgRating) ? avgRating.toFixed(1) : '0.0';

  if (loading) return <Spinner text="Loading skill details..." />;
  if (error) {
    return (
      <div className="text-center p-10 text-blue-600">
        <p className="text-xl font-semibold mb-4">{error}</p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }
  if (!skill) return <p className="text-center p-10">Skill not found.</p>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold mb-2">{skill.title}</h1>
          {!isOwner && isAuthenticated && (
            <button
              onClick={handleReportSkill}
              disabled={isReported || reporting}
              className="flex items-center gap-2 px-3 py-1 text-sm rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isReported
                  ? 'You have already reported this skill'
                  : 'Report this skill'
              }
            >
              <FlagIcon className="h-4 w-4" />
              <span>{isReported ? 'Reported' : 'Report'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center mb-6">
           <span className="text-sm font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100 px-3 py-1 rounded-full mr-2">
    {skill.type || 'OFFER'}
  </span>
  <span className="text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full mr-4">
    {skill.category}
  </span>
          <Link
            to={`/profile/${skill.user?.username || ''}`}
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
          >
            Posted by:{' '}
            <span className="font-medium text-indigo-600 dark:text-indigo-400">
              {skill.user?.username || 'Unknown'}
            </span>
          </Link>
        </div>

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {skill.description}
        </p>

        <div className="mt-6">
  <h3 className="text-lg font-semibold mb-2">Details</h3>
  <ul className="space-y-1 text-gray-700 dark:text-gray-300">
    <li>
      <span className="font-medium">Level:</span> {skill.level || 'Not specified'}
    </li>
    <li>
      <span className="font-medium">Seeking in Return:</span>{' '}
      {skill.seeking || 'Open to offers'}
    </li>
    <li className="flex items-center">
      <MapPinIcon className="h-4 w-4 mr-1" />
      <span>{skill.location || 'Remote'}</span>
    </li>
  </ul>
</div>

        {/* Rating Section */}
        <div className="mt-8 border-t dark:border-gray-700 pt-6">
          <h3 className="text-xl font-semibold mb-2">Skill Rating</h3>
          <div className="flex items-center gap-4 mb-4">
            <p className="font-bold text-lg">{safeAvg} / 5</p>
            <p className="text-sm text-gray-500">
              ({(skill?.ratings || []).length} ratings)
            </p>
          </div>

          {isAuthenticated && !isOwner && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Your Rating:</p>
              <StarRatingInput
                currentRating={userRating}
                onRate={handleRateSkill}
              />
            </div>
          )}

          {(skill.ratings || []).filter(Boolean).length > 0 && (
            <div className="space-y-2 mt-4">
              {(skill.ratings || []).filter(Boolean).map((r, idx) => (
                <div
                  key={r._id || r.user?._id || `rating-${idx}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {r.user?.username || 'A user'}
                  </span>
                  <StarRating rating={r?.rating || 0} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex justify-center items-center gap-4">
          {canPropose && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-3 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Propose a Swap
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400"
            >
              {deleting ? 'Deleting...' : 'Delete Skill'}
            </button>
          )}
        </div>
      </div>

      {(matches || []).filter(Boolean).length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            Top Matches For Your Request
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(matches || []).filter(Boolean).map((matchSkill) => (
              <SkillCard
                key={matchSkill._id || matchSkill?.id}
                skill={matchSkill}
              />
            ))}
          </div>
        </div>
      )}

      <ProposalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        requestedSkill={skill}
      />
    </div>
  );
};

export default SingleSkillPage;
