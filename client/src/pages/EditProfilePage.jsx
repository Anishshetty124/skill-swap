import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EditProfilePage = () => {
  const { user, login } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [locationString, setLocationString] = useState(user?.locationString || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
  };

  const handleRemoveAvatar = async () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      try {
        const response = await apiClient.delete('/users/me/avatar');
        login({ user: response.data.data }); // Update the context
        toast.success('Profile picture removed.');
      } catch (error) {
        toast.error('Failed to remove profile picture.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let updatedUser = { ...user };

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        const cloudinaryData = await cloudinaryRes.json();
        
        const avatarUpdateRes = await apiClient.patch('/users/me/avatar', { avatarUrl: cloudinaryData.secure_url });
        updatedUser = avatarUpdateRes.data.data;
      }

      const profileUpdateRes = await apiClient.patch('/users/me', { bio, locationString });
      updatedUser = { ...updatedUser, ...profileUpdateRes.data.data };

      login({ user: updatedUser });

      toast.success('Profile updated successfully!');
      navigate(`/profile/${user.username}`);

    } catch (err) {
      toast.error('Failed to update profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center mb-6">Edit Your Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-6">
          <img 
            className="w-24 h-24 rounded-full object-cover"
            src={avatarFile ? URL.createObjectURL(avatarFile) : user?.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username}`}
            alt="Profile Preview"
          />
          <div className="flex flex-col gap-4">
            <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
              Change Picture
            </label>
            <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            
            {user?.profilePicture && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="bg-red-500 text-white text-sm px-4 py-2 rounded-md hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium">Location</label>
          <input type="text" placeholder="e.g., Mudhol, Karnataka" value={locationString} onChange={(e) => setLocationString(e.target.value)} className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md"/>
        </div>

        <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditProfilePage;