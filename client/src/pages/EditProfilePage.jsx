import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';

const EditProfilePage = () => {
  const { user, login } = useAuth(); // 'login' is used to update the context state
  const navigate = useNavigate();

  // Initialize state from the logged-in user's data in the context
  const [bio, setBio] = useState(user?.bio || '');
  const [locationString, setLocationString] = useState(user?.locationString || '');
  const [avatarFile, setAvatarFile] = useState(null);
  
  // State for UI feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle file selection for the avatar
  const handleFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: If a new avatar file is selected, upload it to Cloudinary first.
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const cloudinaryData = await cloudinaryRes.json();
        
        // Step 2: After getting the URL from Cloudinary, update it in our backend.
        await apiClient.patch('/users/me/avatar', { avatarUrl: cloudinaryData.secure_url });
      }

      // Step 3: Update text-based profile info (bio and location).
      const profileUpdateRes = await apiClient.patch('/users/me', { bio, locationString });

      // Step 4: Update the user object in our global AuthContext to reflect changes immediately.
      // We reuse the login function for this, passing the new user object.
      login({ user: profileUpdateRes.data.data });

      setSuccess('Profile updated successfully!');
      setTimeout(() => navigate(`/profile/${user.username}`), 1500); // Redirect to profile page on success

    } catch (err) {
      setError('Failed to update profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center mb-6">Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Avatar Upload Section */}
        <div className="flex items-center space-x-6">
          <img 
            className="w-24 h-24 rounded-full object-cover"
            src={avatarFile ? URL.createObjectURL(avatarFile) : user?.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username}`}
            alt="Profile Preview"
          />
          <div>
            <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
              Change Picture
            </label>
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        {/* Bio Text Area */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium">Bio</label>
          <textarea 
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md"
          ></textarea>
        </div>

        {/* Location Input */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium">Location</label>
          <input 
            id="location"
            type="text"
            placeholder="e.g., Mudhol, Karnataka"
            value={locationString}
            onChange={(e) => setLocationString(e.target.value)}
            className="w-full px-3 py-2 mt-1 text-gray-800 border border-gray-300 rounded-md"
          />
        </div>

        {/* Submit Button and feedback messages */}
        <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && <p className="text-green-500 text-center">{success}</p>}
      </form>
    </div>
  );
};

export default EditProfilePage;