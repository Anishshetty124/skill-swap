import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ResetPasswordModal from '../components/profile/ResetPasswordModal';

const EditProfilePage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // State for each editable field
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [locationString, setLocationString] = useState(user?.locationString || '');
  const [socials, setSocials] = useState(user?.socials || { github: '', linkedin: '', website: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (e) => setAvatarFile(e.target.files[0]);

  const handleSocialsChange = (e) => {
    setSocials({ ...socials, [e.target.name]: e.target.value });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      
      // Combine all text-based updates into single requests
      const profileUpdateRes = await apiClient.patch('/users/me', { bio, locationString, socials });
      const accountUpdateRes = await apiClient.patch('/users/me/details', { username, email });
      
      updatedUser = { ...profileUpdateRes.data.data, ...accountUpdateRes.data.data };
      
      login({ user: updatedUser });
      toast.success('Profile updated successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">Edit Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex items-center space-x-6">
            <img 
              className="w-24 h-24 rounded-full object-cover"
              src={avatarFile ? URL.createObjectURL(avatarFile) : user?.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${user?.username}`}
              alt="Profile Preview"
            />
            <div className="flex flex-col gap-4">
              <label htmlFor="avatar-upload" className="cursor-pointer bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-center">Change Picture</label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {user?.profilePicture && (
                <button type="button" onClick={handleRemoveAvatar} className="bg-red-500 text-white text-sm px-4 py-2 rounded-md hover:bg-red-600">Remove</button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
          </div>

          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input type="text" placeholder="e.g., Mudhol, Karnataka" value={locationString} onChange={(e) => setLocationString(e.target.value)} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
          </div>

          <div className="border-t dark:border-slate-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Social Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">GitHub URL</label>
                <input type="url" name="github" value={socials.github} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium">LinkedIn URL</label>
                <input type="url" name="linkedin" value={socials.linkedin} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium">Personal Website URL</label>
                <input type="url" name="website" value={socials.website} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border rounded-md"/>
              </div>
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-accent-600 rounded-md hover:bg-accent-700 disabled:bg-accent-400">
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        <div className="mt-8 border-t dark:border-slate-700 pt-6">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full px-4 py-2 font-bold text-white bg-slate-600 rounded-md hover:bg-slate-700"
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