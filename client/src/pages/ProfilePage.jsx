import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/axios';
import SkillCard from '../components/skills/SkillCard';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/profile/Badge';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: loggedInUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('skills');
  const [showAllSkills, setShowAllSkills] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/users/${username}`);
        setProfile(response.data.data);
      } catch (err) {
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) return <p className="text-center p-10">Loading profile...</p>;
  if (error) return <p className="text-center p-10 text-red-500">{error}</p>;
  if (!profile) return <p className="text-center p-10">User not found.</p>;

  const skillsWithUser = profile.skills.map(skill => ({
    ...skill,
    user: { username: profile.username, profilePicture: profile.profilePicture }
  }));
  
  const topCategories = [...new Set(profile.skills.map(skill => skill.category))];
  const displayedSkills = showAllSkills ? skillsWithUser : skillsWithUser.slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* --- Profile Header --- */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-4">
          <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
            <img 
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-accent-500"
              src={profile.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${profile.username}`}
              alt={profile.username}
            />
            <div>
              <h1 className="text-3xl font-bold">{profile.username}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Member since {new Date(profile.createdAt).toLocaleDateString()}
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{profile.bio || 'This user has not written a bio yet.'}</p>
              <div className="flex items-center justify-center md:justify-start space-x-4 mt-4 text-blue-500 font-semibold">
                {profile.socials?.github && <a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>}
                {profile.socials?.linkedin && <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn</a>}
                {profile.socials?.website && <a href={profile.socials.website} target="_blank" rel="noopener noreferrer" className="hover:underline">Website</a>}
              </div>
            </div>
          </div>
          
          {loggedInUser?.username === username && (
            <Link to="/profile/edit" className="bg-slate-200 dark:bg-slate-700 text-sm font-semibold px-4 py-2 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 flex-shrink-0 w-full md:w-auto text-center">
              Edit Profile
            </Link>
          )}
        </div>
        
        <div className="border-t dark:border-slate-700 mt-6 pt-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Statistics</h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p><strong>Skills Offered:</strong> {profile.skillsOfferedCount}</p>
              <p><strong>Swaps Completed:</strong> {profile.swapsCompleted}</p>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Top Categories</h3>
            <div className="flex flex-wrap gap-2">
              {topCategories.length > 0 ? topCategories.map(cat => (
                <span key={cat} className="bg-accent-100 dark:bg-accent-900 text-accent-800 dark:text-accent-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{cat}</span>
              )) : <p className="text-sm text-slate-500 italic">No categories yet.</p>}
            </div>
          </div>
        </div>
        <div className="border-t dark:border-slate-700 mt-6 pt-6">
          <h3 className="text-lg font-semibold mb-3">Achievements</h3>
          <div className="flex flex-wrap gap-2">
            {profile.badges && profile.badges.length > 0 ? (
              profile.badges.map(badgeName => <Badge key={badgeName} name={badgeName} />)
            ) : (
              <p className="text-sm text-slate-500 italic">No achievements yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-8">
          <button onClick={() => setActiveTab('skills')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'skills' ? 'border-accent-500 text-accent-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Skills Offered</button>
          <button onClick={() => setActiveTab('bookmarks')} className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'bookmarks' ? 'border-accent-500 text-accent-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Bookmarks</button>
        </nav>
      </div>

      <div>
        {activeTab === 'skills' && (
          skillsWithUser.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedSkills.map(skill => <SkillCard key={skill._id} skill={skill} hideUser={true} />)}
              </div>
              {/* Corrected condition from > 6 to > 5 */}
              {skillsWithUser.length > 5 && (
                <div className="text-center mt-8">
                  <button onClick={() => setShowAllSkills(!showAllSkills)} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 font-semibold rounded-md">
                    {showAllSkills ? 'Show Less' : 'Show All'}
                  </button>
                </div>
              )}
            </>
          ) : (<p className="text-slate-500 italic">This user hasn't offered any skills yet.</p>)
        )}
        {activeTab === 'bookmarks' && (
          profile.bookmarks?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.bookmarks.map(skill => <SkillCard key={skill._id} skill={skill} />)}
            </div>
          ) : (<p className="text-slate-500 italic">This user hasn't bookmarked any skills yet.</p>)
        )}
      </div>
    </div>
  );
};

export default ProfilePage;