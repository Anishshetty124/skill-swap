import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import ReviewCard from '../components/profile/ReviewCard';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  // Get the username from the URL (e.g., /profile/testuser)
  const { username } = useParams();
  
  // Get the currently logged-in user from our AuthContext
  const { user: loggedInUser } = useAuth();
  
  // State for the profile data being viewed, loading, and errors
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // This effect fetches the profile data when the component mounts or the username in the URL changes
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/users/${username}`);
        setProfile(response.data.data);
      } catch (err) {
        setError('Failed to load user profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  // --- Render logic based on state ---

  if (loading) return <p className="text-center p-10">Loading profile...</p>;
  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;
  if (!profile) return <p className="text-center p-10">User not found.</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* --- Profile Header --- */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-start">
          {/* User Info Section */}
          <div className="flex items-center space-x-6">
            <img 
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-500"
              src={profile.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username}`}
              alt={profile.username}
            />
            <div>
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{profile.bio || 'This user has not written a bio yet.'}</p>
              <div className="flex items-center mt-3">
                <span className="text-yellow-400 font-bold text-lg mr-2">★ {profile.averageRating}</span>
                <span className="text-gray-500 dark:text-gray-400">({profile.reviews.length} reviews)</span>
              </div>
            </div>
          </div>
          
          {/* Edit Profile Button - Only shows if the logged-in user is viewing their own profile */}
          {loggedInUser?.username === username && (
            <Link to="/profile/edit" className="bg-gray-200 dark:bg-gray-700 text-sm font-semibold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0">
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* --- Skills Section --- */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Skills Offered</h2>
        {profile.skills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.skills.map(skill => <SkillCard key={skill._id} skill={skill} />)}
          </div>
        ) : (
          <p className="text-gray-500 italic">This user hasn't offered any skills yet.</p>
        )}
      </div>

      {/* --- Reviews Section --- */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>
        {profile.reviews.length > 0 ? (
          <div className="space-y-4">
            {profile.reviews.map(review => <ReviewCard key={review._id} review={review} />)}
          </div>
        ) : (
          <p className="text-gray-500 italic">This user has no reviews yet.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;