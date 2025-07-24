import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ResetPasswordModal from '../components/profile/ResetPasswordModal';

const EditProfilePage = () => {
  const { user, login } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [locationString, setLocationString] = useState(user?.locationString || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [socials, setSocials] = useState(user?.socials || { github: '', linkedin: '', website: '' });

  const handleSocialsChange = (e) => {
    setSocials({ ...socials, [e.target.name]: e.target.value });
  };
  const navigate = useNavigate();

  const handleFileChange = (e) => setAvatarFile(e.target.files[0]);

  const handleRemoveAvatar = async () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      try {
        const response = await apiClient.delete('/users/me/avatar');
        login({ user: response.data.data });
        toast.success('Profile picture removed.');
      } catch (error) {
        toast.error('Failed to remove profile picture.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const runUpdates = async () => {
      let updatedUser = { ...user };
      try {
        
        if (avatarFile) {
          const formData = new FormData();
          formData.append('file', avatarFile);
          formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
          const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
          const cloudinaryData = await cloudinaryRes.json();
          const avatarUpdateRes = await apiClient.patch('/users/me/avatar', { avatarUrl: cloudinaryData.secure_url });
          updatedUser = avatarUpdateRes.data.data;
        }
        const profileUpdateRes = await apiClient.patch('/users/me', { bio, locationString, socials });
        updatedUser = { ...updatedUser, ...profileUpdateRes.data.data };
        login({ user: updatedUser });
        toast.success('Profile update in progress!');
      } catch (err) {
        toast.error('Failed to update profile.');
      }
    };

    runUpdates();
    navigate('/');
  };

  return (
    <>
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
              <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-center">
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
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border rounded-md"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input type="text" placeholder="e.g., banglore, Karnataka" value={locationString} onChange={(e) => setLocationString(e.target.value)} className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border rounded-md"/>
          </div>

          <div className="border-t dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Social Links</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">GitHub URL</label>
                    <input type="url" name="github" value={socials.github} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">LinkedIn URL</label>
                    <input type="url" name="linkedin" value={socials.linkedin} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium">Personal Website URL</label>
                    <input type="url" name="website" value={socials.website} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border rounded-md"/>
                </div>
            </div>
        </div>

          <button type="submit" className="w-full px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Save Profile Changes
          </button>
        </form>

        <div className="mt-8 border-t dark:border-gray-700 pt-6">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700"
          >
            Change Password
          </button>
        </div>
      </div>

      <ResetPasswordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    </>
  );
};

export default EditProfilePage;